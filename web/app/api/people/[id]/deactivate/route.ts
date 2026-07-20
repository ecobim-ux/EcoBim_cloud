import { NextResponse } from "next/server";
import { requireRole, requireSession } from "@/lib/server/auth-guard";
import { withOrgContext } from "@/lib/server/db-context";
import { ECOBIM_ORG_ID } from "@/lib/server/org";

/** POST /api/people/:id/deactivate — admin (anyone), team lead (employees
    only). Soft-deletes the account (disables login, marks deleted_at)
    rather than hard-deleting — this schema treats every people-adjacent
    table as an audit trail. `:id` is the person's party id. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const forbidden = requireRole(session, ["admin", "teamlead"]);
  if (forbidden) return forbidden;

  const { id: partyId } = await params;
  if (partyId === session.partyId) {
    return NextResponse.json({ error: "You can't remove your own account." }, { status: 400 });
  }

  const result = await withOrgContext(ECOBIM_ORG_ID, session.userAccountId, async (sql) => {
    if (session.role === "teamlead") {
      const targetRole = await sql<{ role_code: string }[]>`
        select min(r.code) as role_code
        from iam.user_account ua
        join iam.user_role ur on ur.user_account_id = ua.id
        join iam.role r on r.id = ur.role_id
        where ua.party_id = ${partyId} and ua.deleted_at is null
      `;
      if (targetRole[0]?.role_code !== "EMPLOYEE") {
        return { error: "Team leads can only remove employees." as const };
      }
    }

    await sql`
      update iam.user_account set status = 'DISABLED', deleted_at = now(), updated_by = ${session.userAccountId}
      where party_id = ${partyId} and organization_id = ${ECOBIM_ORG_ID} and deleted_at is null
    `;
    await sql`
      update hr.employee set deleted_at = now(), updated_by = ${session.userAccountId}
      where person_id = ${partyId} and organization_id = ${ECOBIM_ORG_ID} and deleted_at is null
    `;
    return { ok: true as const };
  });

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 403 });
  return NextResponse.json(result);
}
