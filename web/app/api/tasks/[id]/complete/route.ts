import { NextResponse } from "next/server";
import { requireSession } from "@/lib/server/auth-guard";
import { withOrgContext } from "@/lib/server/db-context";
import { ECOBIM_ORG_ID } from "@/lib/server/org";
import { withErrorLogging } from "@/lib/server/api-error";

/** POST /api/tasks/:id/complete — the "log time before completing" rule,
    enforced here (not just in the UI) per the audit finding that this was
    previously only a client-side check and therefore bypassable. Admin and
    team leads may also complete a task on behalf of its assignee — same
    permission scope POST /api/tasks and /api/tasks/:id/remove already have. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorLogging("POST /api/tasks/:id/complete", async () => {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const { id: taskId } = await params;

  const result = await withOrgContext(ECOBIM_ORG_ID, session.userAccountId, async (sql) => {
    const assignmentRows = await sql<{ assignee_person_id: string }[]>`
      select assignee_person_id from work.task_assignment
      where task_id = ${taskId} and is_current and deleted_at is null
    `;
    const isAssignee = assignmentRows[0]?.assignee_person_id === session.partyId;
    if (!isAssignee && session.role !== "admin" && session.role !== "teamlead") {
      return { error: "You can only complete your own tasks." as const, status: 403 as const };
    }

    const totalRows = await sql<{ logged_hours: string }[]>`
      select coalesce(sum(hours), 0) as logged_hours from timelog.time_entry
      where task_id = ${taskId} and deleted_at is null
    `;
    if (Number(totalRows[0].logged_hours) <= 0) {
      return { error: "Log time before marking this task complete." as const, status: 400 as const };
    }

    const taskRows = await sql<{ status_code: string }[]>`
      select status_code from work.task where id = ${taskId} and deleted_at is null
    `;
    const fromStatus = taskRows[0]?.status_code;
    if (!fromStatus) return { error: "That task couldn't be found." as const, status: 404 as const };

    await sql`
      update work.task
      set status_code = 'COMPLETED', percent_complete = 100, completed_at = now(), updated_by = ${session.userAccountId}
      where id = ${taskId}
    `;
    await sql`
      insert into work.task_status_history (organization_id, task_id, from_status, to_status, changed_by)
      values (${ECOBIM_ORG_ID}, ${taskId}, ${fromStatus}, 'COMPLETED', ${session.userAccountId})
    `;
    return { ok: true as const };
  });

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, log: { label: "Marked complete", date: new Date().toISOString() } });
  });
}
