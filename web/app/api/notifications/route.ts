import { NextResponse } from "next/server";
import { requireSession } from "@/lib/server/auth-guard";
import { withOrgContext } from "@/lib/server/db-context";
import { notifyLogins } from "@/lib/server/notify";
import { ECOBIM_ORG_ID } from "@/lib/server/org";

export interface ApiNotification {
  id: string;
  title: string;
  body: string;
  tab: string | null;
  read: boolean;
  ts: number;
}

interface DeliveryRow {
  id: string;
  title: string;
  body: string;
  deep_link: string | null;
  read_at: Date | null;
  created_at: Date;
}

/** GET /api/notifications — the current user's own deliveries, newest first. */
export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const rows = await withOrgContext(ECOBIM_ORG_ID, session.userAccountId, async (sql) => {
    return sql<DeliveryRow[]>`
      select n.id, n.title, n.body, n.deep_link, d.read_at, d.created_at
      from comms.notification_delivery d
      join comms.notification n on n.id = d.notification_id
      where d.user_account_id = ${session.userAccountId} and d.dismissed_at is null
      order by d.created_at desc
      limit 200
    `;
  });

  const notifications: ApiNotification[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    tab: r.deep_link,
    read: r.read_at !== null,
    ts: r.created_at.getTime(),
  }));

  return NextResponse.json({ notifications });
}

/** POST /api/notifications — notify specific people by login ID. Any signed-in
    user may send one (matches the previous behavior, where any role could
    addNotif); the point of this endpoint is only that recipients are named
    explicitly instead of broadcast to an entire role. */
export async function POST(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const body = (await req.json().catch(() => null)) as {
    recipientLoginIds?: string[];
    title?: string;
    body?: string;
    tab?: string;
  } | null;

  const recipientLoginIds = body?.recipientLoginIds?.filter((s) => typeof s === "string" && s.trim());
  const title = body?.title?.trim();
  const notifBody = body?.body?.trim();
  if (!recipientLoginIds?.length || !title || !notifBody) {
    return NextResponse.json({ error: "recipientLoginIds, title and body are required." }, { status: 400 });
  }

  await withOrgContext(ECOBIM_ORG_ID, session.userAccountId, async (sql) => {
    await notifyLogins(sql, ECOBIM_ORG_ID, {
      recipientLoginIds,
      eventCode: "PORTAL_MESSAGE",
      title,
      body: notifBody,
      deepLink: body?.tab ?? null,
      createdBy: session.userAccountId,
    });
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
