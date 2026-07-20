import { NextResponse } from "next/server";
import { requireRole, requireSession } from "@/lib/server/auth-guard";
import { withOrgContext } from "@/lib/server/db-context";
import { ECOBIM_ORG_ID } from "@/lib/server/org";

export interface ApiProjectPhase {
  code: string;
  label: string;
  percentComplete: number;
  gateStatus: string;
}

export interface ApiProject {
  id: string;
  code: string;
  name: string;
  client: string | null;
  type: string | null;
  phaseCode: string | null;
  phaseLabel: string | null;
  lod: string | null;
  progress: number;
  teamSize: number;
  lead: string | null;
  issueCount: number;
  openRfis: number;
  start: string | null;
  end: string | null;
  cpct: number;
  phases: ApiProjectPhase[];
}

interface RawPhase {
  code: string;
  label: string;
  percent_complete: string;
  gate_status: string;
}

interface ProjectRow {
  id: string;
  code: string;
  name: string;
  client_name: string | null;
  type_label: string | null;
  progress_pct: string | null;
  open_issues: string | null;
  open_rfis: string | null;
  team_size: string | null;
  lead_name: string | null;
  planned_start: Date | null;
  planned_end: Date | null;
  phase_code: string | null;
  phase_label: string | null;
  lod_min_label: string | null;
  lod_max_label: string | null;
  phases: RawPhase[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function monthYear(d: Date): string {
  return MONTHS[d.getUTCMonth()] + " " + d.getUTCFullYear();
}

function lodRange(min: string | null, max: string | null): string | null {
  if (!min) return null;
  if (!max || min === max) return min;
  return min + "–" + max.replace(/^LOD\s*/, "");
}

/** GET /api/projects — any signed-in staff member (admin/teamlead/employee;
    clients use /api/projects/mine instead, scoped to just their own
    project). Portfolio list backing AllProjectsTab/ProjectDetailModal/
    ProjectTaskSection's project picker/employee MilestonesTab's progress
    cards — replaces the static 3-project PROJECTS array in
    lib/portal/data.ts, which meant any project created after the demo seed
    (e.g. via the new /api/clients onboarding flow) was invisible everywhere. */
export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const forbidden = requireRole(auth.session, ["admin", "teamlead", "employee"]);
  if (forbidden) return forbidden;

  const rows = await withOrgContext(ECOBIM_ORG_ID, auth.session.userAccountId, async (sql) => {
    return sql<ProjectRow[]>`
      select
        p.id, p.code, p.name,
        cap.display_name as client_name,
        pt.label as type_label,
        pr.progress_pct::text as progress_pct,
        oc.open_issues::text as open_issues,
        oc.open_rfis::text as open_rfis,
        tm.team_size::text as team_size,
        lep.display_name as lead_name,
        p.planned_start, p.planned_end,
        curphase.code as phase_code,
        curphase.label as phase_label,
        (select lv2.label from work.task t2 join core.lookup_value lv2 on lv2.id = t2.lod_id
          where t2.project_id = p.id and t2.deleted_at is null and t2.lod_id is not null
          order by lv2.sort_order asc limit 1) as lod_min_label,
        (select lv2.label from work.task t2 join core.lookup_value lv2 on lv2.id = t2.lod_id
          where t2.project_id = p.id and t2.deleted_at is null and t2.lod_id is not null
          order by lv2.sort_order desc limit 1) as lod_max_label,
        coalesce(allphases.phases, '[]'::json) as phases
      from proj.project p
      left join crm.client_account ca on ca.id = p.client_account_id and ca.deleted_at is null
      left join party.party cap on cap.id = ca.party_org_id
      left join core.lookup_value pt on pt.id = p.project_type_id
      left join hr.employee le on le.id = p.lead_employee_id and le.deleted_at is null
      left join party.party lep on lep.id = le.person_id
      left join proj.v_project_progress pr on pr.project_id = p.id
      left join proj.v_project_open_counts oc on oc.project_id = p.id
      left join lateral (
        select count(*) as team_size from proj.project_member m
        where m.project_id = p.id and m.deleted_at is null and (m.active_to is null or m.active_to >= current_date)
      ) tm on true
      left join lateral (
        select lv.code, lv.label from proj.project_phase ph
        join core.lookup_value lv on lv.id = ph.phase_id
        where ph.project_id = p.id and ph.deleted_at is null
        order by (ph.gate_status = 'ACTIVE') desc, lv.sort_order desc
        limit 1
      ) curphase on true
      left join lateral (
        select json_agg(json_build_object('code', lv.code, 'label', lv.label, 'percent_complete', ph.percent_complete, 'gate_status', ph.gate_status) order by lv.sort_order) as phases
        from proj.project_phase ph
        join core.lookup_value lv on lv.id = ph.phase_id
        where ph.project_id = p.id and ph.deleted_at is null
      ) allphases on true
      where p.organization_id = ${ECOBIM_ORG_ID} and p.deleted_at is null
      order by p.created_at
    `;
  });

  const projects: ApiProject[] = rows.map((r) => {
    const start = r.planned_start ?? null;
    const end = r.planned_end ?? null;
    let cpct = 0;
    if (start && end) {
      const total = end.getTime() - start.getTime();
      const elapsed = Date.now() - start.getTime();
      cpct = total > 0 ? Math.max(0, Math.min(100, Math.round((elapsed / total) * 100))) : 0;
    }
    return {
      id: r.id,
      code: r.code,
      name: r.name,
      client: r.client_name,
      type: r.type_label,
      phaseCode: r.phase_code,
      phaseLabel: r.phase_label,
      lod: lodRange(r.lod_min_label, r.lod_max_label),
      progress: r.progress_pct ? Math.round(Number(r.progress_pct)) : 0,
      teamSize: Number(r.team_size ?? 0),
      lead: r.lead_name,
      issueCount: Number(r.open_issues ?? 0),
      openRfis: Number(r.open_rfis ?? 0),
      start: start ? monthYear(start) : null,
      end: end ? monthYear(end) : null,
      cpct,
      phases: (r.phases ?? []).map((ph) => ({ code: ph.code, label: ph.label, percentComplete: Math.round(Number(ph.percent_complete)), gateStatus: ph.gate_status })),
    };
  });

  return NextResponse.json({ projects });
}
