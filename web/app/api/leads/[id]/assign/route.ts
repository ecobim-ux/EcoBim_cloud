import { NextResponse } from "next/server";
import { requireRole, requireSession } from "@/lib/server/auth-guard";
import { withOrgContext } from "@/lib/server/db-context";
import { ECOBIM_ORG_ID } from "@/lib/server/org";
import { withErrorLogging } from "@/lib/server/api-error";

/** POST /api/leads/:id/assign — admin only. Sets the lead's LEAD_OWNER
    (a team lead), releasing any prior owner assignment first — the unique
    index only allows one current (released_at is null) owner per lead. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorLogging("POST /api/leads/:id/assign", async () => {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const forbidden = requireRole(session, ["admin"]);
  if (forbidden) return forbidden;

  const { id: leadId } = await params;
  const body = (await req.json().catch(() => null)) as { teamLeadLoginId?: string } | null;
  const loginId = body?.teamLeadLoginId?.trim();
  if (!loginId) {
    return NextResponse.json({ error: "A team lead is required." }, { status: 400 });
  }

  const result = await withOrgContext(ECOBIM_ORG_ID, session.userAccountId, async (sql) => {
    const empRows = await sql<{ id: string }[]>`
      select e.id from hr.employee e
      join iam.user_account ua on ua.party_id = e.person_id
      where ua.login_id = ${loginId} and e.deleted_at is null and ua.deleted_at is null
    `;
    const employeeId = empRows[0]?.id;
    if (!employeeId) return { error: "That person couldn't be found." as const };

    const leadRows = await sql<{ status_code: string }[]>`
      select status_code from crm.lead where id = ${leadId} and organization_id = ${ECOBIM_ORG_ID} and deleted_at is null
    `;
    const from = leadRows[0]?.status_code;
    if (!from) return { error: "That request couldn't be found." as const };

    await sql`
      update crm.lead_assignment set released_at = now(), updated_by = ${session.userAccountId}
      where lead_id = ${leadId} and kind = 'LEAD_OWNER' and released_at is null and deleted_at is null
    `;
    await sql`
      insert into crm.lead_assignment (organization_id, lead_id, kind, assigned_to_employee_id, assigned_by, created_by, updated_by)
      values (${ECOBIM_ORG_ID}, ${leadId}, 'LEAD_OWNER', ${employeeId}, ${session.userAccountId}, ${session.userAccountId}, ${session.userAccountId})
    `;
    await sql`update crm.lead set status_code = 'ASSIGNED', updated_by = ${session.userAccountId} where id = ${leadId}`;
    await sql`
      insert into crm.lead_status_history (organization_id, lead_id, from_status, to_status, changed_by)
      values (${ECOBIM_ORG_ID}, ${leadId}, ${from}, 'ASSIGNED', ${session.userAccountId})
    `;
    return { ok: true as const };
  });

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
  });
}
