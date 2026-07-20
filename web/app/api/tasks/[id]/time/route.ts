import { NextResponse } from "next/server";
import { requireSession, resolveEmployeeId } from "@/lib/server/auth-guard";
import { withOrgContext } from "@/lib/server/db-context";
import { ECOBIM_ORG_ID } from "@/lib/server/org";
import { todayISO } from "@/lib/server/task-mapping";

/** POST /api/tasks/:id/time — log hours against a task. Only the assignee
    (or an admin) may log time on it — checked server-side, not just hidden
    in the UI, per the audit finding on client-only business rules. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const { id: taskId } = await params;

  const body = (await req.json().catch(() => null)) as { hours?: number } | null;
  const hours = body?.hours;
  if (!hours || hours <= 0 || hours > 24) {
    return NextResponse.json({ error: "Enter a valid number of hours (up to 24 per entry)." }, { status: 400 });
  }

  const employeeId = await resolveEmployeeId(session.partyId);
  if (!employeeId) {
    return NextResponse.json({ error: "Only staff accounts can log time." }, { status: 403 });
  }

  const result = await withOrgContext(ECOBIM_ORG_ID, session.userAccountId, async (sql) => {
    const assignmentRows = await sql<{ assignee_person_id: string }[]>`
      select assignee_person_id from work.task_assignment
      where task_id = ${taskId} and is_current and deleted_at is null
    `;
    const isAssignee = assignmentRows[0]?.assignee_person_id === session.partyId;
    if (!isAssignee && session.role !== "admin") {
      return { error: "You can only log time on your own tasks." as const, status: 403 as const };
    }

    await sql`
      insert into timelog.time_entry (organization_id, employee_id, task_id, work_date, hours, created_by, updated_by)
      values (${ECOBIM_ORG_ID}, ${employeeId}, ${taskId}, ${todayISO()}, ${hours}, ${session.userAccountId}, ${session.userAccountId})
    `;

    const totalRows = await sql<{ logged_hours: string }[]>`
      select coalesce(sum(hours), 0) as logged_hours from timelog.time_entry
      where task_id = ${taskId} and deleted_at is null
    `;
    return { logged: Number(totalRows[0].logged_hours) };
  });

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result);
}
