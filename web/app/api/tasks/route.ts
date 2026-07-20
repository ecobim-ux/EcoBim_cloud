import { NextResponse } from "next/server";
import { requireRole, requireSession } from "@/lib/server/auth-guard";
import { withOrgContext } from "@/lib/server/db-context";
import { ECOBIM_ORG_ID } from "@/lib/server/org";
import { formatShortDate, PRIORITY_CODE_TO_LABEL, PRIORITY_LABEL_TO_CODE, STATUS_CODE_TO_LABEL } from "@/lib/server/task-mapping";

export interface ApiTaskRecord {
  hours: number;
  date: string;
}

export interface ApiTask {
  id: string;
  code: string;
  task: string;
  description: string | null;
  del: string;
  lod: string;
  phase: string;
  status: string;
  pct: number;
  due: string | null;
  delay: string | null;
  priority: string;
  est: number;
  by: string;
  assignedTo: string;
  today: boolean;
  logged: number;
  records: ApiTaskRecord[];
  completedOn: string | null;
  milestone: string | null;
  project: string;
}

interface TaskRow {
  id: string;
  code: string;
  title: string;
  description: string | null;
  deliverable_label: string | null;
  lod_label: string | null;
  milestone_label: string | null;
  priority_code: string;
  status_code: string;
  estimated_hours: string | null;
  percent_complete: number;
  due_on: Date | null;
  scheduled_on: Date | null;
  delay_reason: string | null;
  completed_at: Date | null;
  assignee_name: string;
  assigner_name: string | null;
  logged_hours: string | null;
  records: ApiTaskRecord[];
  project_name: string;
}

function toApiTask(row: TaskRow): ApiTask {
  return {
    id: row.id,
    code: row.code,
    task: row.title,
    description: row.description,
    del: row.deliverable_label ?? "Task",
    lod: row.lod_label ?? "—",
    phase: "CD",
    status: STATUS_CODE_TO_LABEL[row.status_code] ?? row.status_code,
    pct: row.percent_complete,
    due: formatShortDate(row.due_on),
    delay: row.delay_reason,
    priority: PRIORITY_CODE_TO_LABEL[row.priority_code] ?? row.priority_code,
    est: row.estimated_hours ? Number(row.estimated_hours) : 8,
    by: row.assigner_name ?? "—",
    assignedTo: row.assignee_name,
    today: row.scheduled_on !== null,
    logged: row.logged_hours ? Number(row.logged_hours) : 0,
    records: row.records ?? [],
    completedOn: formatShortDate(row.completed_at),
    milestone: row.milestone_label,
    project: row.project_name,
  };
}

/** GET /api/tasks — employees only ever see their own; admin/team lead see everyone's. */
export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const rows = await withOrgContext(ECOBIM_ORG_ID, session.userAccountId, async (sql) => {
    return sql<TaskRow[]>`
      select
        t.id, t.code, t.title, t.description,
        dt.label as deliverable_label,
        lod.label as lod_label,
        ms.label as milestone_label,
        t.priority_code, t.status_code, t.estimated_hours, t.percent_complete,
        t.due_on, t.scheduled_on, t.delay_reason, t.completed_at,
        assignee.display_name as assignee_name,
        assigner.display_name as assigner_name,
        logged.logged_hours,
        coalesce(records.records, '[]'::json) as records,
        prj.name as project_name
      from work.task t
      join work.task_assignment ta on ta.task_id = t.id and ta.is_current and ta.deleted_at is null
      join party.party assignee on assignee.id = ta.assignee_person_id
      left join party.party assigner on assigner.id = ta.assigned_by_person_id
      left join core.lookup_value dt on dt.id = t.deliverable_type_id
      left join core.lookup_value lod on lod.id = t.lod_id
      left join proj.milestone ms on ms.id = t.milestone_id
      join proj.project prj on prj.id = t.project_id
      left join timelog.v_task_logged_hours logged on logged.task_id = t.id
      left join lateral (
        select json_agg(json_build_object('hours', te.hours, 'date', te.work_date) order by te.work_date) as records
        from timelog.time_entry te
        where te.task_id = t.id and te.deleted_at is null
      ) records on true
      where t.deleted_at is null
        and (${session.role === "employee"} = false or ta.assignee_person_id = ${session.partyId})
      order by (t.due_on is null), t.due_on, t.created_at
    `;
  });

  return NextResponse.json({ tasks: rows.map(toApiTask) });
}

/** POST /api/tasks — admin and team lead only; employees cannot assign tasks to themselves or others. */
export async function POST(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const forbidden = requireRole(session, ["admin", "teamlead"]);
  if (forbidden) return forbidden;

  const body = (await req.json().catch(() => null)) as {
    title?: string;
    description?: string;
    assigneeLoginId?: string;
    projectName?: string;
    priority?: string;
    dueOn?: string;
    milestoneLabel?: string;
  } | null;

  const title = body?.title?.trim();
  const assigneeLoginId = body?.assigneeLoginId?.trim();
  const projectName = body?.projectName?.trim();
  if (!title || !assigneeLoginId) {
    return NextResponse.json({ error: "A task title and an assignee are required." }, { status: 400 });
  }

  const priorityCode = body?.priority ? PRIORITY_LABEL_TO_CODE[body.priority] ?? "MEDIUM" : "MEDIUM";

  const result = await withOrgContext(ECOBIM_ORG_ID, session.userAccountId, async (sql) => {
    const assigneeRows = await sql<{ party_id: string }[]>`
      select ua.party_id from iam.user_account ua where ua.login_id = ${assigneeLoginId} and ua.deleted_at is null
    `;
    const assigneeParty = assigneeRows[0]?.party_id;
    if (!assigneeParty) return { error: "That person couldn't be found." as const };

    const projectRows = projectName
      ? await sql<{ id: string }[]>`
          select id from proj.project where organization_id = ${ECOBIM_ORG_ID} and name = ${projectName} and deleted_at is null limit 1
        `
      : await sql<{ id: string }[]>`
          select id from proj.project where organization_id = ${ECOBIM_ORG_ID} and deleted_at is null order by created_at limit 1
        `;
    const projectId = projectRows[0]?.id;
    if (!projectId) return { error: "That project couldn't be found." as const };

    const milestoneLabel = body?.milestoneLabel?.trim();
    const milestoneId = milestoneLabel
      ? (
          await sql<{ id: string }[]>`
            select id from proj.milestone where project_id = ${projectId} and label = ${milestoneLabel} and deleted_at is null limit 1
          `
        )[0]?.id ?? null
      : null;

    const code = "TSK-" + Date.now().toString().slice(-9);
    const description = body?.description?.trim() || null;
    const taskRows = await sql<{ id: string }[]>`
      insert into work.task (organization_id, code, project_id, milestone_id, title, description, priority_code, status_code, due_on, created_by, updated_by)
      values (${ECOBIM_ORG_ID}, ${code}, ${projectId}, ${milestoneId}, ${title}, ${description}, ${priorityCode}, 'NOT_STARTED', ${body?.dueOn ?? null}, ${session.userAccountId}, ${session.userAccountId})
      returning id
    `;
    const taskId = taskRows[0].id;

    await sql`
      insert into work.task_assignment (organization_id, task_id, assignee_person_id, assigned_by_person_id, created_by, updated_by)
      values (${ECOBIM_ORG_ID}, ${taskId}, ${assigneeParty}, ${session.partyId}, ${session.userAccountId}, ${session.userAccountId})
    `;

    return { taskId };
  });

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ id: result.taskId }, { status: 201 });
}
