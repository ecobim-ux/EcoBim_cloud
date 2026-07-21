import "server-only";
import type { TransactionSql } from "postgres";
import { ECOBIM_ORG_ID } from "./org";

/** Assigns an employee to a team lead's team, releasing any other active
    membership first — an employee belongs to exactly one team lead at a
    time (enforced here and backstopped by the ux_team_member_current_active
    partial unique index in 0021). Auto-creates the lead's team if this is
    the first employee ever assigned to them. */
export async function assignEmployeeToTeamLead(
  sql: TransactionSql,
  employeeId: string,
  teamLeadEmployeeId: string,
  actorUserAccountId: string,
): Promise<{ ok: true } | { error: string }> {
  const existingTeam = await sql<{ id: string }[]>`
    select id from hr.team where lead_employee_id = ${teamLeadEmployeeId} and deleted_at is null limit 1
  `;
  let teamId = existingTeam[0]?.id;

  if (!teamId) {
    const leadName = await sql<{ display_name: string }[]>`
      select p.display_name from hr.employee e join party.party p on p.id = e.person_id where e.id = ${teamLeadEmployeeId}
    `;
    const code = "TEAM-" + Date.now().toString().slice(-9);
    const created = await sql<{ id: string }[]>`
      insert into hr.team (organization_id, code, name, lead_employee_id, created_by, updated_by)
      values (${ECOBIM_ORG_ID}, ${code}, ${(leadName[0]?.display_name ?? "Team") + "'s Team"}, ${teamLeadEmployeeId}, ${actorUserAccountId}, ${actorUserAccountId})
      returning id
    `;
    teamId = created[0].id;
  }

  const currentMembership = await sql<{ team_id: string }[]>`
    select team_id from hr.team_member where employee_id = ${employeeId} and left_on is null and deleted_at is null limit 1
  `;
  if (currentMembership[0]?.team_id === teamId) {
    return { ok: true };
  }

  await sql`
    update hr.team_member set left_on = current_date, updated_by = ${actorUserAccountId}
    where employee_id = ${employeeId} and left_on is null and deleted_at is null
  `;
  await sql`
    insert into hr.team_member (organization_id, team_id, employee_id, created_by, updated_by)
    values (${ECOBIM_ORG_ID}, ${teamId}, ${employeeId}, ${actorUserAccountId}, ${actorUserAccountId})
  `;
  return { ok: true };
}

/** Resolves the hr.employee.id of the team lead a given employee currently
    reports to, or null if unassigned. */
export async function resolveTeamLeadEmployeeId(sql: TransactionSql, employeeId: string): Promise<string | null> {
  const rows = await sql<{ lead_employee_id: string | null }[]>`
    select t.lead_employee_id
    from hr.team_member tm
    join hr.team t on t.id = tm.team_id and t.deleted_at is null
    where tm.employee_id = ${employeeId} and tm.left_on is null and tm.deleted_at is null
    limit 1
  `;
  return rows[0]?.lead_employee_id ?? null;
}
