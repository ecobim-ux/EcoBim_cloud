import { NextResponse } from "next/server";
import { requireRole, requireSession } from "@/lib/server/auth-guard";
import { withOrgContext } from "@/lib/server/db-context";
import { ECOBIM_ORG_ID } from "@/lib/server/org";
import { withErrorLogging } from "@/lib/server/api-error";

/** POST /api/tasks/:id/remove — admin/team lead only. Soft-deletes a task
    they created (this schema treats every table as an audit trail). */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorLogging("POST /api/tasks/:id/remove", async () => {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const forbidden = requireRole(session, ["admin", "teamlead"]);
  if (forbidden) return forbidden;

  const { id: taskId } = await params;

  await withOrgContext(ECOBIM_ORG_ID, session.userAccountId, async (sql) => {
    await sql`
      update work.task set deleted_at = now(), updated_by = ${session.userAccountId}
      where id = ${taskId} and organization_id = ${ECOBIM_ORG_ID} and deleted_at is null
    `;
  });

  return NextResponse.json({ ok: true });
  });
}
