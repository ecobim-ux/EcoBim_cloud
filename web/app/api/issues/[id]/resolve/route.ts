import { NextResponse } from "next/server";
import { requireRole, requireSession } from "@/lib/server/auth-guard";
import { withOrgContext } from "@/lib/server/db-context";
import { ECOBIM_ORG_ID } from "@/lib/server/org";

/** POST /api/issues/:id/resolve — admin/team lead only. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const forbidden = requireRole(session, ["admin", "teamlead"]);
  if (forbidden) return forbidden;

  const { id: issueId } = await params;

  await withOrgContext(ECOBIM_ORG_ID, session.userAccountId, async (sql) => {
    await sql`
      update bim.issue set status_code = 'RESOLVED', resolved_at = now(), updated_by = ${session.userAccountId}
      where id = ${issueId} and organization_id = ${ECOBIM_ORG_ID} and deleted_at is null
    `;
    await sql`
      insert into bim.issue_event (organization_id, issue_id, event_code, actor_party_id) values (${ECOBIM_ORG_ID}, ${issueId}, 'RESOLVED', ${session.partyId})
    `;
  });

  return NextResponse.json({ ok: true });
}
