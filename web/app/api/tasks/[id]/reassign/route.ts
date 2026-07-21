import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, requireSession } from "@/lib/server/auth-guard";
import { withOrgContext } from "@/lib/server/db-context";
import { ECOBIM_ORG_ID } from "@/lib/server/org";
import { withErrorLogging } from "@/lib/server/api-error";
import { parseBody, requiredString } from "@/lib/server/validate";

const ReassignTaskSchema = z.object({
  assigneeLoginId: requiredString("An assignee is required."),
});

export interface ApiTaskLogEntry {
  label: string;
  date: string;
}

/** POST /api/tasks/:id/reassign — admin/team lead only, same permission
    scope as POST /api/tasks and /api/tasks/:id/remove. Releases the current
    work.task_assignment row and inserts a new one for the chosen assignee
    (release-then-insert, same pattern as hr.team_member reassignment), and
    logs the change to work.task_status_history — that table already existed
    for status transitions but was never written to; reused here as the
    append-only activity log the Team Tasks widget shows inline. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorLogging("POST /api/tasks/:id/reassign", async () => {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const forbidden = requireRole(session, ["admin", "teamlead"]);
  if (forbidden) return forbidden;

  const { id: taskId } = await params;
  const parsed = await parseBody(req, ReassignTaskSchema);
  if ("error" in parsed) return parsed.error;
  const { assigneeLoginId } = parsed.data;

  const result = await withOrgContext(ECOBIM_ORG_ID, session.userAccountId, async (sql) => {
    const taskRows = await sql<{ status_code: string }[]>`
      select status_code from work.task where id = ${taskId} and organization_id = ${ECOBIM_ORG_ID} and deleted_at is null
    `;
    const statusCode = taskRows[0]?.status_code;
    if (!statusCode) return { error: "That task couldn't be found." as const };

    const assigneeRows = await sql<{ party_id: string; name: string }[]>`
      select ua.party_id, p.display_name as name from iam.user_account ua
      join party.party p on p.id = ua.party_id
      where ua.login_id = ${assigneeLoginId} and ua.deleted_at is null
    `;
    const assignee = assigneeRows[0];
    if (!assignee) return { error: "That person couldn't be found." as const };

    await sql`
      update work.task_assignment set is_current = false, unassigned_at = now(), updated_by = ${session.userAccountId}
      where task_id = ${taskId} and is_current and deleted_at is null
    `;
    await sql`
      insert into work.task_assignment (organization_id, task_id, assignee_person_id, assigned_by_person_id, created_by, updated_by)
      values (${ECOBIM_ORG_ID}, ${taskId}, ${assignee.party_id}, ${session.partyId}, ${session.userAccountId}, ${session.userAccountId})
    `;
    await sql`
      insert into work.task_status_history (organization_id, task_id, from_status, to_status, changed_by, note)
      values (${ECOBIM_ORG_ID}, ${taskId}, ${statusCode}, ${statusCode}, ${session.userAccountId}, ${"Reassigned to " + assignee.name})
    `;
    return { name: assignee.name };
  });

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  const log: ApiTaskLogEntry = { label: "Reassigned to " + result.name, date: new Date().toISOString() };
  return NextResponse.json({ ok: true, log });
  });
}
