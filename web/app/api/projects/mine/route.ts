import { NextResponse } from "next/server";
import { requireRole, requireSession } from "@/lib/server/auth-guard";
import { withOrgContext } from "@/lib/server/db-context";
import { ECOBIM_ORG_ID } from "@/lib/server/org";
import { withErrorLogging } from "@/lib/server/api-error";

export interface ApiProjectPhase {
  label: string;
  percentComplete: number;
  gateStatus: string;
}

export interface ApiMyProject {
  name: string;
  code: string;
  currentPhaseLabel: string | null;
  currentPhaseCode: string | null;
  overallProgress: number;
  phasesComplete: number;
  phasesTotal: number;
  pendingApprovals: number;
  openRfis: number;
  openIssues: number;
  phases: ApiProjectPhase[];
  contact: { name: string; role: string | null; email: string | null } | null;
}

interface ProjectRow {
  id: string;
  code: string;
  name: string;
  client_account_id: string;
  progress_pct: string | null;
  open_issues: string | null;
  open_rfis: string | null;
  lead_name: string | null;
  lead_email: string | null;
  lead_title: string | null;
}

interface PhaseRow {
  label: string;
  code: string;
  percent_complete: string;
  gate_status: string;
}

/** GET /api/projects/mine — client only. Resolves the logged-in client's own
    project (via crm.client_account.primary_contact_party_id) and returns its
    real progress/phase/approval data — replaces the ClientPortal shell's old
    hardcoded "Dubai Marina Developments / 68%" numbers, which were shown
    identically to every client regardless of who actually logged in. */
export async function GET() {
  return withErrorLogging("GET /api/projects/mine", async () => {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const forbidden = requireRole(session, ["client"]);
  if (forbidden) return forbidden;

  const result = await withOrgContext(ECOBIM_ORG_ID, session.userAccountId, async (sql) => {
    const projectRows = await sql<ProjectRow[]>`
      select p.id, p.code, p.name, p.client_account_id,
             pr.progress_pct::text as progress_pct,
             oc.open_issues::text as open_issues,
             oc.open_rfis::text as open_rfis,
             lep.display_name as lead_name,
             (select cp.value from party.contact_point cp where cp.party_id = lep.id and cp.kind = 'EMAIL' and cp.is_primary and cp.deleted_at is null limit 1) as lead_email,
             jp.title as lead_title
      from proj.project p
      join crm.client_account ca on ca.id = p.client_account_id and ca.deleted_at is null
      left join proj.v_project_progress pr on pr.project_id = p.id
      left join proj.v_project_open_counts oc on oc.project_id = p.id
      left join hr.employee le on le.id = p.lead_employee_id and le.deleted_at is null
      left join party.party lep on lep.id = le.person_id
      left join hr.job_position jp on jp.id = le.job_position_id
      where ca.primary_contact_party_id = ${session.partyId} and p.deleted_at is null
      order by p.created_at
      limit 1
    `;
    const project = projectRows[0];
    if (!project) return { project: null };

    const phaseRows = await sql<PhaseRow[]>`
      select lv.label, lv.code, ph.percent_complete::text, ph.gate_status
      from proj.project_phase ph
      join core.lookup_value lv on lv.id = ph.phase_id
      where ph.project_id = ${project.id} and ph.deleted_at is null
      order by lv.sort_order
    `;

    const approvalRows = await sql<{ count: string }[]>`
      select count(*)::text from wf.workflow_instance wi
      join wf.workflow_stage st on st.id = wi.current_stage_id
      where wi.client_account_id = ${project.client_account_id} and wi.deleted_at is null and not st.is_terminal
    `;

    return { project, phases: phaseRows, pendingApprovals: Number(approvalRows[0]?.count ?? 0) };
  });

  if (!result.project) return NextResponse.json({ project: null });
  const { project, phases, pendingApprovals } = result as { project: ProjectRow; phases: PhaseRow[]; pendingApprovals: number };

  const activePhase = phases.find((p) => p.gate_status === "ACTIVE");
  const lastPhase = phases[phases.length - 1];
  const apiProject: ApiMyProject = {
    name: project.name,
    code: project.code,
    currentPhaseLabel: activePhase?.label ?? lastPhase?.label ?? null,
    currentPhaseCode: activePhase?.code ?? lastPhase?.code ?? null,
    overallProgress: project.progress_pct ? Math.round(Number(project.progress_pct)) : 0,
    phasesComplete: phases.filter((p) => p.gate_status === "DONE").length,
    phasesTotal: phases.length,
    pendingApprovals,
    openRfis: Number(project.open_rfis ?? 0),
    openIssues: Number(project.open_issues ?? 0),
    phases: phases.map((p) => ({ label: p.label, percentComplete: Math.round(Number(p.percent_complete)), gateStatus: p.gate_status })),
    contact: project.lead_name ? { name: project.lead_name, role: project.lead_title, email: project.lead_email } : null,
  };

  return NextResponse.json({ project: apiProject });
  });
}
