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
