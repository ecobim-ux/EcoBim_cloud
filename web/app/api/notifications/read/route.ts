import { NextResponse } from "next/server";
import { requireSession } from "@/lib/server/auth-guard";
import { withOrgContext } from "@/lib/server/db-context";
import { ECOBIM_ORG_ID } from "@/lib/server/org";

/** POST /api/notifications/read — body {id} marks one delivery read (only if
    it belongs to the caller); no body marks every unread delivery of the
    caller's read. Ownership is enforced by scoping every update to
    user_account_id = session.userAccountId, never by trusting the id alone. */
export async function POST(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const body = (await req.json().catch(() => null)) as { id?: string } | null;
  const id = body?.id;

  await withOrgContext(ECOBIM_ORG_ID, session.userAccountId, async (sql) => {
    if (id) {
      await sql`
        update comms.notification_delivery
        set read_at = now(), updated_at = now(), updated_by = ${session.userAccountId}
        where notification_id = ${id} and user_account_id = ${session.userAccountId} and read_at is null
      `;
    } else {
      await sql`
        update comms.notification_delivery
        set read_at = now(), updated_at = now(), updated_by = ${session.userAccountId}
        where user_account_id = ${session.userAccountId} and read_at is null
      `;
    }
  });

  return NextResponse.json({ ok: true });
}
