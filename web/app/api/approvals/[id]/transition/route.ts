import { NextResponse } from "next/server";
import { requireSession } from "@/lib/server/auth-guard";
import { withOrgContext } from "@/lib/server/db-context";
import { ECOBIM_ORG_ID } from "@/lib/server/org";

const ACTION_RULES: Record<string, { toStageCode: string | null; roles: string[]; terminal?: boolean }> = {
  SUGGEST_UPDATES: { toStageCode: "CHANGES_REQUESTED", roles: ["admin"] },
  SEND_TO_CLIENT: { toStageCode: "SENT_TO_CLIENT", roles: ["admin"] },
  APPROVE: { toStageCode: "APPROVED", roles: ["admin", "client"], terminal: true },
  REQUEST_REVISION: { toStageCode: "CHANGES_REQUESTED", roles: ["client"] },
  REMIND: { toStageCode: null, roles: ["admin"] },
};

/** POST /api/approvals/:id/transition — body {action, note?}. A single
    endpoint for every approval-workflow action rather than one route per
    action, since they're all "record a wf.workflow_action, maybe move
    current_stage_id" with only the target stage/allowed roles differing. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const { id: instanceId } = await params;
  const body = (await req.json().catch(() => null)) as { action?: string; note?: string } | null;
  const action = body?.action;
  const rule = action ? ACTION_RULES[action] : undefined;
  if (!action || !rule) {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
  if (!rule.roles.includes(session.role)) {
    return NextResponse.json({ error: "You don't have permission to do that." }, { status: 403 });
  }

  const result = await withOrgContext(ECOBIM_ORG_ID, session.userAccountId, async (sql) => {
    const instanceRows = await sql<{ current_stage_id: string; definition_id: string }[]>`
      select current_stage_id, definition_id from wf.workflow_instance
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

    await sql`
      insert into wf.workflow_action (organization_id, instance_id, from_stage_id, to_stage_id, action_code, actor_party_id, note)
      values (${ECOBIM_ORG_ID}, ${instanceId}, ${instance.current_stage_id}, ${toStageId}, ${action}, ${session.partyId}, ${body?.note?.trim() || null})
    `;
    if (rule.toStageCode) {
      await sql`
        update wf.workflow_instance
        set current_stage_id = ${toStageId}, updated_by = ${session.userAccountId}, closed_at = ${rule.terminal ? sql`now()` : sql`closed_at`}
        where id = ${instanceId}
      `;
    }
    return { ok: true as const };
  });

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
