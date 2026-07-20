import { NextResponse } from "next/server";
import { requireRole, requireSession } from "@/lib/server/auth-guard";
import { withOrgContext } from "@/lib/server/db-context";
import { ECOBIM_ORG_ID } from "@/lib/server/org";
import { STATUS_CODE_TO_LABEL } from "@/lib/server/task-mapping";

export interface ApiTeamMember {
  partyId: string;
  name: string;
  initials: string;
  role: string | null;
  email: string | null;
  project: string | null;
  task: string | null;
  lod: string | null;
  pct: number;
  status: string;
  hoursLogged: number;
  hoursTarget: number;
  lastActive: string | null;
  hasDelay: boolean;
}

interface TeamRow {
  party_id: string;
  name: string;
  role_title: string | null;
  email: string | null;
  last_login_at: Date | null;
  project_name: string | null;
  current_task_title: string | null;
  current_status_code: string | null;
  current_pct: number | null;
  current_lod: string | null;
  hours_this_week: string | null;
  has_delay: boolean;
}

const HOURS_TARGET = 40;

function initialsOf(name: string): string {
  const w = name.trim().split(/\s+/);
  return (((w[0] || "")[0] || "") + ((w[1] || "")[0] || (w[0] || "")[1] || "")).toUpperCase() || "?";
}

function formatLastActive(d: Date | null): string | null {
  if (!d) return null;
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (sameDay) return "Today, " + time;
  if (isYesterday) return "Yesterday, " + time;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ", " + time;
}

/** GET /api/team — admin + team lead. Real per-employee roster with their
    current project/task/progress/status/hours-this-week/last-active —
    replaces the static 4-person TEAM array in lib/portal/data.ts, which
    never reflected anyone added via the real "Add person" flow and never
    changed regardless of real task/time-entry activity. */
export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const forbidden = requireRole(auth.session, ["admin", "teamlead"]);
  if (forbidden) return forbidden;

  const rows = await withOrgContext(ECOBIM_ORG_ID, auth.session.userAccountId, async (sql) => {
    return sql<TeamRow[]>`
      select
        emp_party.id as party_id,
        emp_party.display_name as name,
        jp.title as role_title,
        (select cp.value from party.contact_point cp where cp.party_id = emp_party.id and cp.kind = 'EMAIL' and cp.is_primary and cp.deleted_at is null limit 1) as email,
        ua.last_login_at,
        pmproj.name as project_name,
        ct.title as current_task_title,
        ct.status_code as current_status_code,
        ct.percent_complete as current_pct,
        lodlv.label as current_lod,
        coalesce(wk.hours, 0)::text as hours_this_week,
        coalesce(dl.has_delay, false) as has_delay
      from hr.employee e
      join party.party emp_party on emp_party.id = e.person_id and emp_party.deleted_at is null
      left join hr.job_position jp on jp.id = e.job_position_id
      join iam.user_account ua on ua.party_id = emp_party.id and ua.deleted_at is null
      join iam.user_role ur on ur.user_account_id = ua.id
      join iam.role r on r.id = ur.role_id and r.code = 'EMPLOYEE'
      left join lateral (
        select proj.name from proj.project_member pm
        join proj.project proj on proj.id = pm.project_id and proj.deleted_at is null
        where pm.person_id = emp_party.id and pm.deleted_at is null and (pm.active_to is null or pm.active_to >= current_date)
        order by pm.active_from desc limit 1
      ) pmproj on true
      left join lateral (
        select t.title, t.status_code, t.percent_complete, t.lod_id
        from work.task t
        join work.task_assignment ta on ta.task_id = t.id and ta.is_current and ta.deleted_at is null
        where ta.assignee_person_id = emp_party.id and t.deleted_at is null
        order by (t.status_code = 'COMPLETED'), (t.due_on is null), t.due_on
        limit 1
      ) ct on true
      left join core.lookup_value lodlv on lodlv.id = ct.lod_id
      left join lateral (
        select sum(te.hours) as hours from timelog.time_entry te
        where te.employee_id = e.id and te.deleted_at is null and te.work_date >= date_trunc('week', current_date)::date
      ) wk on true
      left join lateral (
        select true as has_delay from work.task t2
        join work.task_assignment ta2 on ta2.task_id = t2.id and ta2.is_current and ta2.deleted_at is null
        where ta2.assignee_person_id = emp_party.id and t2.status_code = 'DELAYED' and t2.deleted_at is null
        limit 1
      ) dl on true
      where e.organization_id = ${ECOBIM_ORG_ID} and e.deleted_at is null
      order by emp_party.display_name
    `;
  });

  const team: ApiTeamMember[] = rows.map((r) => ({
    partyId: r.party_id,
    name: r.name,
    initials: initialsOf(r.name),
    role: r.role_title,
    email: r.email,
    project: r.project_name,
    task: r.current_task_title,
    lod: r.current_lod,
    pct: r.current_pct !== null ? Math.round(Number(r.current_pct)) : 0,
    status: r.current_status_code ? (STATUS_CODE_TO_LABEL[r.current_status_code] ?? r.current_status_code) : "Not Started",
    hoursLogged: r.hours_this_week ? Number(r.hours_this_week) : 0,
    hoursTarget: HOURS_TARGET,
    lastActive: formatLastActive(r.last_login_at),
    hasDelay: r.has_delay,
  }));

  return NextResponse.json({ team });
}
