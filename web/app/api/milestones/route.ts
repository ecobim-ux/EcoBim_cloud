import { NextResponse } from "next/server";
import { requireSession } from "@/lib/server/auth-guard";
import { withOrgContext } from "@/lib/server/db-context";
import { ECOBIM_ORG_ID } from "@/lib/server/org";

export interface ApiMilestone {
  id: string;
  label: string;
  date: string;
  status: string;
  done: boolean;
  active: boolean;
}

interface MilestoneRow {
  id: string;
  label: string;
  due_on: Date | null;
  status: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function monthYear(d: Date): string {
  return MONTHS[d.getUTCMonth()] + " " + d.getUTCFullYear();
}

/** GET /api/milestones — clients only see milestones flagged client_visible
    on their own project; admin/team lead/employee see every milestone on
    the org's primary project (matches the single-project scope the rest
    of the portal already assumes). */
export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const rows = await withOrgContext(ECOBIM_ORG_ID, session.userAccountId, async (sql) => {
    if (session.role === "client") {
      return sql<MilestoneRow[]>`
        select m.id, m.label, m.due_on, m.status
        from proj.milestone m
        join proj.project p on p.id = m.project_id
        join crm.client_account ca on ca.id = p.client_account_id
        where m.organization_id = ${ECOBIM_ORG_ID} and m.deleted_at is null and m.client_visible
          and ca.primary_contact_party_id = ${session.partyId}
        order by m.due_on nulls last, m.created_at
      `;
    }
    return sql<MilestoneRow[]>`
      select m.id, m.label, m.due_on, m.status
      from proj.milestone m
      where m.organization_id = ${ECOBIM_ORG_ID} and m.deleted_at is null
        and m.project_id = (select id from proj.project where organization_id = ${ECOBIM_ORG_ID} and deleted_at is null order by created_at limit 1)
      order by m.due_on nulls last, m.created_at
    `;
  });

  const milestones: ApiMilestone[] = rows.map((r) => ({
    id: r.id,
    label: r.label,
    date: r.due_on ? monthYear(r.due_on) : "TBD",
    status: r.status,
    done: r.status === "DONE",
    active: r.status === "ACTIVE",
  }));

  return NextResponse.json({ milestones });
}
