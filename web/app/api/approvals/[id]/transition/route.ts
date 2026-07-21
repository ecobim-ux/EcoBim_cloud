import { NextResponse } from "next/server";
import { requireSession } from "@/lib/server/auth-guard";
import { withOrgContext } from "@/lib/server/db-context";
import { ECOBIM_ORG_ID } from "@/lib/server/org";
import { withErrorLogging } from "@/lib/server/api-error";
import { APPROVAL_ACTION_RULES } from "@/lib/server/approval-rules";

/** POST /api/approvals/:id/transition — body {action, note?}. A single
    endpoint for every approval-workflow action rather than one route per
    action, since they're all "record a wf.workflow_action, maybe move
    current_stage_id" with only the target stage/allowed roles differing. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorLogging("POST /api/approvals/:id/transition", async () => {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const { id: instanceId } = await params;
  const body = (await req.json().catch(() => null)) as { action?: string; note?: string; expectedVersion?: number } | null;
  const action = body?.action;
  const rule = action ? APPROVAL_ACTION_RULES[action] : undefined;
  if (!action || !rule) {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
  if (!rule.roles.includes(session.role)) {
    return NextResponse.json({ error: "You don't have permission to do that." }, { status: 403 });
  }
  const expectedVersion = body?.expectedVersion;

  const result = await withOrgContext(ECOBIM_ORG_ID, session.userAccountId, async (sql) => {
    const instanceRows = await sql<{ current_stage_id: string; definition_id: string; row_version: number }[]>`
      select current_stage_id, definition_id, row_version from wf.workflow_instance
      where id = ${instanceId} and organization_id = ${ECOBIM_ORG_ID} and deleted_at is null
    `;
    const instance = instanceRows[0];
    if (!instance) return { error: "That approval couldn't be found." as const };

    const toStageId = rule.toStageCode
      ? (
          await sql<{ id: string }[]>`
            select id from wf.workflow_stage where definition_id = ${instance.definition_id} and code = ${rule.toStageCode}
          `
        )[0]?.id
      : instance.current_stage_id;
    if (!toStageId) return { error: "That transition isn't configured." as const };

    // Someone else may have transitioned this approval between the client's
    // last read and this write — checked here (not just relied on in the
    // UI) since row_version is otherwise a schema promise the app never
    // actually keeps. A stale expectedVersion means we skip the write
    // entirely rather than silently overwriting a newer transition.
    if (rule.toStageCode) {
      if (typeof expectedVersion === "number" && expectedVersion !== instance.row_version) {
        return { error: "conflict" as const, conflict: true as const };
      }
      const updated = await sql`
        update wf.workflow_instance
        set current_stage_id = ${toStageId}, updated_by = ${session.userAccountId}, closed_at = ${rule.terminal ? sql`now()` : sql`closed_at`}
        where id = ${instanceId} and row_version = ${instance.row_version}
      `;
      if (updated.count === 0) return { error: "conflict" as const, conflict: true as const };
    }

    await sql`
      insert into wf.workflow_action (organization_id, instance_id, from_stage_id, to_stage_id, action_code, actor_party_id, note)
      values (${ECOBIM_ORG_ID}, ${instanceId}, ${instance.current_stage_id}, ${toStageId}, ${action}, ${session.partyId}, ${body?.note?.trim() || null})
    `;
    return { ok: true as const };
  });

  if ("error" in result) {
    if ("conflict" in result) {
      return NextResponse.json({ error: "This approval was just updated by someone else. Refresh and try again." }, { status: 409 });
    }
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
  });
}
