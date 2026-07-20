import { NextResponse } from "next/server";
import { requireRole, requireSession } from "@/lib/server/auth-guard";
import { withOrgContext } from "@/lib/server/db-context";
import { ECOBIM_ORG_ID } from "@/lib/server/org";

/** POST /api/issues/:id/escalate — team lead only. Re-routes the issue to
    admin and records an ESCALATED event, instead of the old localStorage
    hack of creating a whole second issue titled "Escalated: ...". */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const forbidden = requireRole(session, ["teamlead"]);
  if (forbidden) return forbidden;

  const { id: issueId } = await params;
  const body = (await req.json().catch(() => null)) as { note?: string } | null;

  const result = await withOrgContext(ECOBIM_ORG_ID, session.userAccountId, async (sql) => {
    const adminRows = await sql<{ party_id: string }[]>`
      select ua.party_id from iam.user_account ua
      join iam.user_role ur on ur.user_account_id = ua.id
      join iam.role r on r.id = ur.role_id
      where r.code = 'ADMIN' and ua.organization_id = ${ECOBIM_ORG_ID} and ua.deleted_at is null
      limit 1
    `;
    const adminParty = adminRows[0]?.party_id;
    if (!adminParty) return { error: "No admin account found." as const };

    await sql`
      update bim.issue set status_code = 'ESCALATED', routed_to_party_id = ${adminParty}, updated_by = ${session.userAccountId}
      where id = ${issueId} and organization_id = ${ECOBIM_ORG_ID} and deleted_at is null
    `;
    await sql`
      insert into bim.issue_event (organization_id, issue_id, event_code, actor_party_id, body)
      values (${ECOBIM_ORG_ID}, ${issueId}, 'ESCALATED', ${session.partyId}, ${body?.note?.trim() || null})
    `;
    return { ok: true as const };
  });

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
