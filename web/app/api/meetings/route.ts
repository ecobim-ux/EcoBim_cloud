import { NextResponse } from "next/server";
import { requireSession } from "@/lib/server/auth-guard";
import { withOrgContext } from "@/lib/server/db-context";
import { ECOBIM_ORG_ID } from "@/lib/server/org";

/** Parses "30 min" / "1 hr" / "45 min" -> minutes. Falls back to 30. */
function parseDurationMinutes(dur: string | undefined): number {
  if (!dur) return 30;
  const n = parseFloat(dur);
  if (Number.isNaN(n)) return 30;
  return /hr/i.test(dur) ? Math.round(n * 60) : Math.round(n);
}

function formatDurationLabel(mins: number): string {
  return mins % 60 === 0 && mins >= 60 ? mins / 60 + " hr" : mins + " min";
}

export interface ApiMeeting {
  id: string;
  code: string;
  title: string;
  startsAt: string;
  date: string;
  time: string;
  durationLabel: string;
  joinUrl: string | null;
  note: string | null;
  organizerName: string;
  isOrganizer: boolean;
  attendees: string[];
}

interface MeetingRow {
  id: string;
  code: string;
  title: string;
  starts_at: Date;
  duration_minutes: number;
  join_url: string | null;
  note: string | null;
  organizer_name: string;
  is_organizer: boolean;
  attendees: string[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function formatDate(d: Date): string {
  return String(d.getUTCDate()).padStart(2, "0") + " " + MONTHS[d.getUTCMonth()] + " " + d.getUTCFullYear();
}
function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
}

/** GET /api/meetings — any signed-in user; returns meetings they organized
    or were invited to (upcoming + recently started, so nothing vanishes the
    moment it begins). Previously nothing ever read comms.meeting back after
    creation — not even the organizer got confirmation beyond the one-time
    modal — so a scheduled meeting was effectively invisible everywhere the
    instant that panel closed. */
export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const rows = await withOrgContext(ECOBIM_ORG_ID, session.userAccountId, async (sql) => {
    return sql<MeetingRow[]>`
      select
        m.id, m.code, m.title, m.starts_at, m.duration_minutes, m.join_url, m.note,
        org.display_name as organizer_name,
        (m.organizer_party_id = ${session.partyId}) as is_organizer,
        coalesce((
          select json_agg(att_party.display_name order by att_party.display_name)
          from comms.meeting_attendee ma
          join party.party att_party on att_party.id = ma.party_id
          where ma.meeting_id = m.id and ma.deleted_at is null
        ), '[]'::json) as attendees
      from comms.meeting m
      join party.party org on org.id = m.organizer_party_id
      where m.organization_id = ${ECOBIM_ORG_ID} and m.deleted_at is null and m.cancelled_at is null
        and m.starts_at >= now() - interval '2 hours'
        and (
          m.organizer_party_id = ${session.partyId}
          or exists (select 1 from comms.meeting_attendee ma where ma.meeting_id = m.id and ma.party_id = ${session.partyId} and ma.deleted_at is null)
        )
      order by m.starts_at asc
      limit 15
    `;
  });

  const meetings: ApiMeeting[] = rows.map((r) => ({
    id: r.id,
    code: r.code,
    title: r.title,
    startsAt: r.starts_at.toISOString(),
    date: formatDate(r.starts_at),
    time: formatTime(r.starts_at),
    durationLabel: formatDurationLabel(r.duration_minutes),
    joinUrl: r.join_url,
    note: r.note,
    organizerName: r.organizer_name,
    isOrganizer: r.is_organizer,
    attendees: r.attendees ?? [],
  }));

  return NextResponse.json({ meetings });
}

/** POST /api/meetings — any signed-in user may schedule one, matching the
    previous behavior (any role could addMeeting()). Persists to
    comms.meeting/comms.meeting_attendee instead of localStorage, which
    nothing ever actually read back — this is what makes a real meeting
    record queryable for the first time. */
export async function POST(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const body = (await req.json().catch(() => null)) as {
    title?: string;
    date?: string;
    time?: string;
    duration?: string;
    joinUrl?: string;
    note?: string;
    attendeeLoginIds?: string[];
  } | null;

  const title = body?.title?.trim();
  const date = body?.date?.trim();
  const time = body?.time?.trim() || "10:00";
  const attendeeLoginIds = (body?.attendeeLoginIds || []).filter((s) => typeof s === "string" && s.trim());
  if (!title || !date) {
    return NextResponse.json({ error: "A title and date are required." }, { status: 400 });
  }

  const startsAt = new Date(`${date}T${time}:00`);
  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: "Invalid date or time." }, { status: 400 });
  }
  const durationMinutes = Math.min(480, Math.max(5, parseDurationMinutes(body?.duration)));

  const result = await withOrgContext(ECOBIM_ORG_ID, session.userAccountId, async (sql) => {
    const attendeeParties = attendeeLoginIds.length
      ? await sql<{ party_id: string }[]>`
          select party_id from iam.user_account where login_id in ${sql(attendeeLoginIds)} and deleted_at is null
        `
      : [];

    const projectRows = await sql<{ id: string }[]>`
      select id from proj.project where organization_id = ${ECOBIM_ORG_ID} and deleted_at is null order by created_at limit 1
    `;
    const projectId = projectRows[0]?.id ?? null;

    const code = "MTG-" + Date.now().toString().slice(-6);
    const meetingRows = await sql<{ id: string }[]>`
      insert into comms.meeting (organization_id, code, title, starts_at, duration_minutes, provider, join_url, organizer_party_id, project_id, note, created_by, updated_by)
      values (${ECOBIM_ORG_ID}, ${code}, ${title}, ${startsAt.toISOString()}, ${durationMinutes}, 'GOOGLE_MEET', ${body?.joinUrl ?? null}, ${session.partyId}, ${projectId}, ${body?.note?.trim() || null}, ${session.userAccountId}, ${session.userAccountId})
      returning id
    `;
    const meetingId = meetingRows[0].id;

    for (const a of attendeeParties) {
      await sql`
        insert into comms.meeting_attendee (organization_id, meeting_id, party_id, created_by, updated_by)
        values (${ECOBIM_ORG_ID}, ${meetingId}, ${a.party_id}, ${session.userAccountId}, ${session.userAccountId})
      `;
    }

    return { id: meetingId, code };
  });

  return NextResponse.json(result, { status: 201 });
}
