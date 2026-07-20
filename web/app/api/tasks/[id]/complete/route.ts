import { NextResponse } from "next/server";
import { requireSession } from "@/lib/server/auth-guard";
import { withOrgContext } from "@/lib/server/db-context";
import { ECOBIM_ORG_ID } from "@/lib/server/org";

/** POST /api/tasks/:id/complete — the "log time before completing" rule,
    enforced here (not just in the UI) per the audit finding that this was
    previously only a client-side check and therefore bypassable. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
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
    if (!isAssignee && session.role !== "admin") {
      return { error: "You can only complete your own tasks." as const, status: 403 as const };
    }

    const totalRows = await sql<{ logged_hours: string }[]>`
      select coalesce(sum(hours), 0) as logged_hours from timelog.time_entry
      where task_id = ${taskId} and deleted_at is null
    `;
    if (Number(totalRows[0].logged_hours) <= 0) {
      return { error: "Log time before marking this task complete." as const, status: 400 as const };
    }

    await sql`
      update work.task
      set status_code = 'COMPLETED', percent_complete = 100, completed_at = now(), updated_by = ${session.userAccountId}
      where id = ${taskId}
    `;
    return { ok: true as const };
  });

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result);
}
