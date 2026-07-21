import { NextResponse } from "next/server";
import { requireSession } from "@/lib/server/auth-guard";
import { withOrgContext } from "@/lib/server/db-context";
import { ECOBIM_ORG_ID } from "@/lib/server/org";
import { PRIORITY_CODE_TO_LABEL } from "@/lib/server/task-mapping";
import { withErrorLogging } from "@/lib/server/api-error";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  RESPONDED: "Responded",
  CLOSED: "Closed",
};

export interface ApiRfi {
  id: string;
  code: string;
  title: string;
  status: string;
  priority: string;
  raised: string;
  assigneeName: string | null;
  response: string | null;
  respondedBy: string | null;
}

interface RfiRow {
  id: string;
  code: string;
  title: string;
  status_code: string;
  priority_code: string;
  raised_on: Date;
  assignee_name: string | null;
  resp_body: string | null;
  resp_by: string | null;
}

function shortDate(d: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return String(d.getUTCDate()).padStart(2, "0") + " " + months[d.getUTCMonth()] + " " + d.getUTCFullYear();
}

/** GET /api/rfis — admin/team lead see every RFI. Employees see RFIs
    assigned to them or that they raised. Clients see RFIs directed to
    them. The old model showed the same static RFI list to every employee
    and every client regardless of who it actually concerned. */
export async function GET() {
  return withErrorLogging("GET /api/rfis", async () => {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const rows = await withOrgContext(ECOBIM_ORG_ID, session.userAccountId, async (sql) => {
    return sql<RfiRow[]>`
      select
        r.id, r.code, r.title, r.status_code, r.priority_code, r.raised_on,
        assignee.display_name as assignee_name,
        resp.body as resp_body, resp_party.display_name as resp_by
      from bim.rfi r
      left join party.party assignee on assignee.id = r.assignee_person_id
      left join lateral (
        select body, author_party_id from bim.rfi_response rr
        where rr.rfi_id = r.id and rr.deleted_at is null
        order by rr.responded_at desc limit 1
      ) resp on true
      left join party.party resp_party on resp_party.id = resp.author_party_id
      where r.organization_id = ${ECOBIM_ORG_ID} and r.deleted_at is null
        and (
          ${session.role === "admin" || session.role === "teamlead"}
          or r.assignee_person_id = ${session.partyId}
          or r.raised_by_party_id = ${session.partyId}
          or r.directed_to_party_id = ${session.partyId}
        )
      order by r.raised_on desc, r.created_at desc
      limit 500
    `;
  });

  const rfis: ApiRfi[] = rows.map((r) => ({
    id: r.id,
    code: r.code,
    title: r.title,
    status: STATUS_LABEL[r.status_code] ?? r.status_code,
    priority: PRIORITY_CODE_TO_LABEL[r.priority_code] ?? r.priority_code,
    raised: shortDate(r.raised_on),
    assigneeName: r.assignee_name,
    response: r.resp_body,
    respondedBy: r.resp_by,
  }));

  return NextResponse.json({ rfis });
  });
}
