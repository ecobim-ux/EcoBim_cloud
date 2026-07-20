import { NextResponse } from "next/server";
import { requireRole, requireSession } from "@/lib/server/auth-guard";
import { withOrgContext } from "@/lib/server/db-context";
import { ECOBIM_ORG_ID } from "@/lib/server/org";

const ACTION_LABEL: Record<string, string> = {
  REQUEST_REVIEW: "Team lead requested admin review",
  SUGGEST_UPDATES: "Admin requested updates",
  SEND_TO_CLIENT: "Admin reviewed & sent to client",
  APPROVE: "Client approved",
  REQUEST_REVISION: "Client requested changes",
  REMIND: "Reminder emailed to client",
};

export interface ApiApprovalHistoryEntry {
  label: string;
  date: string;
}

export interface ApiApproval {
  id: string;
  code: string;
  proj: string;
  milestone: string;
  submitted: string;
  client: string;
  clientEmail: string | null;
  by: string | null;
  stage: string;
  leadNote: string | null;
  adminNote: string | null;
  lastReminder: string | null;
  history: ApiApprovalHistoryEntry[];
}

interface InstanceRow {
  id: string;
  code: string;
  title: string;
  opened_at: Date;
  project_name: string | null;
  client_name: string | null;
  client_email: string | null;
  stage_label: string;
  requested_by: string | null;
  lead_note: string | null;
  admin_note: string | null;
  last_reminder: Date | null;
}

interface ActionRow {
  instance_id: string;
  action_code: string;
  occurred_at: Date;
}

function shortDate(d: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return String(d.getUTCDate()).padStart(2, "0") + " " + months[d.getUTCMonth()] + " " + d.getUTCFullYear();
}

/** GET /api/approvals — admin/team lead see every approval in the
    pipeline. Clients only see approvals tied to their own client_account —
    the old client-facing "Pending Your Approval" widget was entirely
    hardcoded and never actually read the real approval state at all. */
export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const { instances, actions } = await withOrgContext(ECOBIM_ORG_ID, session.userAccountId, async (sql) => {
    const instances = await sql<InstanceRow[]>`
      select
        wi.id, wi.code, wi.title, wi.opened_at,
        p.name as project_name,
        party_org.display_name as client_name,
        (select cp.value from party.contact_point cp where cp.party_id = party_org.id and cp.kind = 'EMAIL' and cp.is_primary and cp.deleted_at is null limit 1) as client_email,
        st.label as stage_label,
        (select actor.display_name from wf.workflow_action wa join party.party actor on actor.id = wa.actor_party_id where wa.instance_id = wi.id and wa.action_code = 'REQUEST_REVIEW' order by wa.occurred_at asc limit 1) as requested_by,
        (select wa.note from wf.workflow_action wa where wa.instance_id = wi.id and wa.action_code = 'REQUEST_REVIEW' order by wa.occurred_at asc limit 1) as lead_note,
        (select wa.note from wf.workflow_action wa where wa.instance_id = wi.id and wa.action_code = 'SUGGEST_UPDATES' order by wa.occurred_at desc limit 1) as admin_note,
        (select wa.occurred_at from wf.workflow_action wa where wa.instance_id = wi.id and wa.action_code = 'REMIND' order by wa.occurred_at desc limit 1) as last_reminder
      from wf.workflow_instance wi
      join wf.workflow_stage st on st.id = wi.current_stage_id
      left join proj.project p on p.id = wi.project_id
      left join crm.client_account ca on ca.id = wi.client_account_id
      left join party.party party_org on party_org.id = ca.party_org_id
      where wi.organization_id = ${ECOBIM_ORG_ID} and wi.deleted_at is null
        and (
          ${session.role === "admin" || session.role === "teamlead"}
          or ca.primary_contact_party_id = ${session.partyId}
        )
      order by wi.opened_at desc
    `;
    const ids = instances.map((i) => i.id);
    const actions = ids.length
      ? await sql<ActionRow[]>`
          select instance_id, action_code, occurred_at from wf.workflow_action
          where instance_id in ${sql(ids)}
          order by occurred_at asc
        `
      : [];
    return { instances, actions };
  });

  const historyByInstance = new Map<string, ApiApprovalHistoryEntry[]>();
  for (const a of actions) {
    const label = ACTION_LABEL[a.action_code] ?? a.action_code;
    const list = historyByInstance.get(a.instance_id) ?? [];
    list.push({ label, date: shortDate(a.occurred_at) });
    historyByInstance.set(a.instance_id, list);
  }

  const approvals: ApiApproval[] = instances.map((r) => ({
    id: r.id,
    code: r.code,
    proj: r.project_name ?? "—",
    milestone: r.title,
    submitted: shortDate(r.opened_at),
    client: r.client_name ?? "—",
    clientEmail: r.client_email,
    by: r.requested_by,
    stage: r.stage_label,
    leadNote: r.lead_note,
    adminNote: r.admin_note,
    lastReminder: r.last_reminder ? shortDate(r.last_reminder) : null,
    history: historyByInstance.get(r.id) ?? [],
  }));

  return NextResponse.json({ approvals });
}

/** POST /api/approvals — team lead opens a new client-approval request. */
export async function POST(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const forbidden = requireRole(session, ["teamlead"]);
  if (forbidden) return forbidden;

  const body = (await req.json().catch(() => null)) as { title?: string; projectName?: string; note?: string } | null;
  const title = body?.title?.trim();
  const projectName = body?.projectName?.trim();
  if (!title) {
    return NextResponse.json({ error: "A title is required." }, { status: 400 });
  }

  const result = await withOrgContext(ECOBIM_ORG_ID, session.userAccountId, async (sql) => {
    const projectRows = projectName
      ? await sql<{ id: string; client_account_id: string | null }[]>`
          select id, client_account_id from proj.project where organization_id = ${ECOBIM_ORG_ID} and name = ${projectName} and deleted_at is null limit 1
        `
      : await sql<{ id: string; client_account_id: string | null }[]>`
          select id, client_account_id from proj.project where organization_id = ${ECOBIM_ORG_ID} and deleted_at is null order by created_at limit 1
        `;
    const project = projectRows[0];
    if (!project) return { error: "That project couldn't be found." as const };

    const defRows = await sql<{ id: string }[]>`select id from wf.workflow_definition where code = 'CLIENT_APPROVAL' and organization_id is null`;
    const definitionId = defRows[0]?.id;
    if (!definitionId) return { error: "Approval workflow isn't configured." as const };

    const stageRows = await sql<{ id: string }[]>`select id from wf.workflow_stage where definition_id = ${definitionId} and code = 'LEAD_REQUESTED'`;
    const stageId = stageRows[0]?.id;
    if (!stageId) return { error: "Approval workflow isn't configured." as const };

    const code = "APR-" + Date.now().toString().slice(-6);
    const instanceRows = await sql<{ id: string }[]>`
      insert into wf.workflow_instance (organization_id, code, definition_id, current_stage_id, title, project_id, client_account_id, opened_by, created_by, updated_by)
      values (${ECOBIM_ORG_ID}, ${code}, ${definitionId}, ${stageId}, ${title}, ${project.id}, ${project.client_account_id}, ${session.userAccountId}, ${session.userAccountId}, ${session.userAccountId})
      returning id
    `;
    const instanceId = instanceRows[0].id;
    await sql`
      insert into wf.workflow_action (organization_id, instance_id, to_stage_id, action_code, actor_party_id, note)
      values (${ECOBIM_ORG_ID}, ${instanceId}, ${stageId}, 'REQUEST_REVIEW', ${session.partyId}, ${body?.note?.trim() || null})
    `;
    return { id: instanceId };
  });

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result, { status: 201 });
}
