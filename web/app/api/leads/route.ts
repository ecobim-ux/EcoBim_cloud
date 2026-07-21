import { NextResponse } from "next/server";
import { requireRole, requireSession, resolveEmployeeId } from "@/lib/server/auth-guard";
import { withOrgContext } from "@/lib/server/db-context";
import { ECOBIM_ORG_ID } from "@/lib/server/org";
import { withErrorLogging } from "@/lib/server/api-error";

const STATUS_LABEL: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  ASSIGNED: "Assigned",
  CONVERTED: "Converted",
  LOST: "Lost",
};

export interface ApiLead {
  id: string;
  code: string;
  name: string;
  company: string | null;
  role: string | null;
  scale: string | null;
  services: string[];
  details: string | null;
  date: string;
  status: string;
  assignedTo: string | null;
  assignedEmployee: string | null;
  email: string | null;
  phone: string | null;
}

interface LeadRow {
  id: string;
  code: string;
  contact_name: string;
  company_name: string | null;
  contact_role: string | null;
  project_scale: string | null;
  brief: string | null;
  email: string | null;
  phone: string | null;
  status_code: string;
  created_at: Date;
  lead_owner_name: string | null;
  delegate_name: string | null;
  services: string[];
}

function shortDate(d: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return String(d.getUTCDate()).padStart(2, "0") + " " + months[d.getUTCMonth()] + " " + d.getUTCFullYear();
}

/** GET /api/leads — admin sees every estimate request. Team leads only see
    ones currently assigned to them as LEAD_OWNER. */
export async function GET() {
  return withErrorLogging("GET /api/leads", async () => {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const forbidden = requireRole(session, ["admin", "teamlead"]);
  if (forbidden) return forbidden;

  const employeeId = session.role === "teamlead" ? await resolveEmployeeId(session.partyId) : null;

  const rows = await withOrgContext(ECOBIM_ORG_ID, session.userAccountId, async (sql) => {
    return sql<LeadRow[]>`
      select
        l.id, l.code, l.contact_name, l.company_name, l.contact_role, l.project_scale, l.brief, l.email, l.phone,
        l.status_code, l.created_at,
        owner_party.display_name as lead_owner_name,
        delegate_party.display_name as delegate_name,
        (select coalesce(json_agg(sc.name order by sc.sort_order), '[]'::json) from crm.lead_service ls join crm.service_catalog sc on sc.id = ls.service_id where ls.lead_id = l.id) as services
      from crm.lead l
      left join lateral (
        select assigned_to_employee_id from crm.lead_assignment
        where lead_id = l.id and kind = 'LEAD_OWNER' and released_at is null and deleted_at is null limit 1
      ) owner_a on true
      left join hr.employee owner_emp on owner_emp.id = owner_a.assigned_to_employee_id
      left join party.party owner_party on owner_party.id = owner_emp.person_id
      left join lateral (
        select assigned_to_employee_id from crm.lead_assignment
        where lead_id = l.id and kind = 'DELEGATE' and released_at is null and deleted_at is null limit 1
      ) delegate_a on true
      left join hr.employee delegate_emp on delegate_emp.id = delegate_a.assigned_to_employee_id
      left join party.party delegate_party on delegate_party.id = delegate_emp.person_id
      where l.organization_id = ${ECOBIM_ORG_ID} and l.deleted_at is null
        and (${session.role === "admin"} or owner_a.assigned_to_employee_id = ${employeeId})
      order by l.created_at desc
      limit 500
    `;
  });

  const leads: ApiLead[] = rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.contact_name,
    company: r.company_name,
    role: r.contact_role,
    scale: r.project_scale,
    services: r.services ?? [],
    details: r.brief,
    date: shortDate(r.created_at),
    status: STATUS_LABEL[r.status_code] ?? r.status_code,
    assignedTo: r.lead_owner_name,
    assignedEmployee: r.delegate_name,
    email: r.email,
    phone: r.phone,
  }));

  return NextResponse.json({ leads });
  });
}
