import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, requireSession } from "@/lib/server/auth-guard";
import { withOrgContext } from "@/lib/server/db-context";
import { ECOBIM_ORG_ID } from "@/lib/server/org";
import { withErrorLogging } from "@/lib/server/api-error";
import { parseBody, requiredString } from "@/lib/server/validate";
import { assignEmployeeToTeamLead } from "@/lib/server/team-assignment";

const AssignTeamLeadSchema = z.object({
  teamLeadLoginId: requiredString("A team lead is required."),
});

/** POST /api/people/:id/team-lead — admin only. `:id` is the employee's
    party id (matches /api/people/:id/deactivate's convention). Assigns them
    to the named team lead's team, releasing any prior team membership so
    an employee reports to exactly one team lead at a time. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorLogging("POST /api/people/:id/team-lead", async () => {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;
    const { session } = auth;
    const forbidden = requireRole(session, ["admin"]);
    if (forbidden) return forbidden;

    const { id: partyId } = await params;
    const parsed = await parseBody(req, AssignTeamLeadSchema);
    if ("error" in parsed) return parsed.error;
    const { teamLeadLoginId } = parsed.data;

    const result = await withOrgContext(ECOBIM_ORG_ID, session.userAccountId, async (sql) => {
      const employeeRows = await sql<{ id: string }[]>`
        select id from hr.employee where person_id = ${partyId} and organization_id = ${ECOBIM_ORG_ID} and deleted_at is null
      `;
      const employeeId = employeeRows[0]?.id;
      if (!employeeId) return { error: "That person isn't a staff employee." as const };

      const leadRows = await sql<{ id: string }[]>`
        select e.id from hr.employee e
        join iam.user_account ua on ua.party_id = e.person_id
        join iam.user_role ur on ur.user_account_id = ua.id
        join iam.role r on r.id = ur.role_id
        where ua.login_id = ${teamLeadLoginId} and r.code = 'TEAM_LEAD' and e.deleted_at is null and ua.deleted_at is null
      `;
      const teamLeadEmployeeId = leadRows[0]?.id;
      if (!teamLeadEmployeeId) return { error: "That team lead couldn't be found." as const };

      return assignEmployeeToTeamLead(sql, employeeId, teamLeadEmployeeId, session.userAccountId);
    });

    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result);
  });
}
