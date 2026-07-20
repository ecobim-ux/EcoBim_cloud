import { NextResponse } from "next/server";
import { requireRole, requireSession } from "@/lib/server/auth-guard";
import { withOrgContext } from "@/lib/server/db-context";
import { ECOBIM_ORG_ID } from "@/lib/server/org";
import { PRIORITY_CODE_TO_LABEL, PRIORITY_LABEL_TO_CODE } from "@/lib/server/task-mapping";

const STATUS_TO_BADGE: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  ESCALATED: "In Progress",
  RESOLVED: "Completed",
  CLOSED: "Completed",
};

export interface ApiIssue {
  id: string;
  code: string;
  title: string;
  by: string;
  raiserRole: string;
  date: string;
  desc: string;
  sev: string;
  status: string;
  resolved: boolean;
  raisedToAdmin: boolean;
  response: string | null;
  respondedBy: string | null;
  respondedDate: string | null;
  project: string | null;
}

interface IssueRow {
  id: string;
  code: string;
  title: string;
  description: string;
  severity_code: string;
  status_code: string;
  raised_on: Date;
  raiser_name: string;
  raiser_role: string;
  escalated: boolean;
  resp_body: string | null;
  resp_by: string | null;
  resp_at: Date | null;
  project_name: string | null;
}

function shortDate(d: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return String(d.getUTCDate()).padStart(2, "0") + " " + months[d.getUTCMonth()] + " " + d.getUTCFullYear();
}

/** GET /api/issues — admin/team lead see every issue in the org (matches
    the existing Team/Open-Issues boards, which have always been org-wide
    coordination views). Employees only see issues they raised or that were
    routed to them — the old localStorage model showed every employee every
    raised issue regardless of recipient. */
export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const rows = await withOrgContext(ECOBIM_ORG_ID, session.userAccountId, async (sql) => {
    return sql<IssueRow[]>`
      select
        i.id, i.code, i.title, i.description, i.severity_code, i.status_code, i.raised_on,
        raiser.display_name as raiser_name,
        coalesce((select min(r.code) from iam.user_account ua join iam.user_role ur on ur.user_account_id = ua.id join iam.role r on r.id = ur.role_id where ua.party_id = i.raised_by_party_id), 'EMPLOYEE') as raiser_role,
        exists(select 1 from bim.issue_event e where e.issue_id = i.id and e.event_code = 'ESCALATED') as escalated,
        resp.body as resp_body, resp_party.display_name as resp_by, resp.occurred_at as resp_at,
        prj.name as project_name
      from bim.issue i
      join party.party raiser on raiser.id = i.raised_by_party_id
      left join proj.project prj on prj.id = i.project_id
      left join lateral (
        select body, actor_party_id, occurred_at from bim.issue_event e
        where e.issue_id = i.id and e.event_code = 'RESPONDED'
        order by e.occurred_at desc limit 1
      ) resp on true
      left join party.party resp_party on resp_party.id = resp.actor_party_id
      where i.organization_id = ${ECOBIM_ORG_ID} and i.deleted_at is null
        and (
          ${session.role === "admin" || session.role === "teamlead"}
          or i.raised_by_party_id = ${session.partyId}
          or i.routed_to_party_id = ${session.partyId}
        )
      order by i.raised_on desc, i.created_at desc
    `;
  });

  const issues: ApiIssue[] = rows.map((r) => ({
    id: r.id,
    code: r.code,
    title: r.title,
    by: r.raiser_name,
    raiserRole: r.raiser_role.toLowerCase() === "team_lead" ? "teamlead" : r.raiser_role.toLowerCase(),
    date: shortDate(r.raised_on),
    desc: r.description,
    sev: PRIORITY_CODE_TO_LABEL[r.severity_code] ?? r.severity_code,
    status: STATUS_TO_BADGE[r.status_code] ?? r.status_code,
    resolved: r.status_code === "RESOLVED" || r.status_code === "CLOSED",
    raisedToAdmin: r.escalated,
    response: r.resp_body,
    respondedBy: r.resp_by,
    respondedDate: r.resp_at ? shortDate(r.resp_at) : null,
    project: r.project_name,
  }));

  return NextResponse.json({ issues });
}

/** POST /api/issues — admin/team lead raise a new issue, routed to a
    specific person by login ID (not broadcast to a role). */
export async function POST(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const forbidden = requireRole(session, ["admin", "teamlead"]);
  if (forbidden) return forbidden;

  const body = (await req.json().catch(() => null)) as {
    title?: string;
    description?: string;
    severity?: string;
    recipientLoginId?: string;
  } | null;

  const title = body?.title?.trim();
  const description = body?.description?.trim();
  const recipientLoginId = body?.recipientLoginId?.trim();
  if (!title || !description || !recipientLoginId) {
    return NextResponse.json({ error: "A title, description and recipient are required." }, { status: 400 });
  }
  const severityCode = body?.severity ? PRIORITY_LABEL_TO_CODE[body.severity] ?? "MEDIUM" : "MEDIUM";

  const result = await withOrgContext(ECOBIM_ORG_ID, session.userAccountId, async (sql) => {
    const recipientRows = await sql<{ party_id: string }[]>`
      select party_id from iam.user_account where login_id = ${recipientLoginId} and deleted_at is null
    `;
    const recipientParty = recipientRows[0]?.party_id;
    if (!recipientParty) return { error: "That person couldn't be found." as const };

    const projectRows = await sql<{ id: string }[]>`
      select id from proj.project where organization_id = ${ECOBIM_ORG_ID} and deleted_at is null order by created_at limit 1
    `;
    const projectId = projectRows[0]?.id;
    if (!projectId) return { error: "No project found to attach this issue to." as const };

    const code = "ISS-" + Date.now().toString().slice(-6);
    const issueRows = await sql<{ id: string }[]>`
      insert into bim.issue (organization_id, code, project_id, title, description, severity_code, raised_by_party_id, routed_to_party_id, created_by, updated_by)
      values (${ECOBIM_ORG_ID}, ${code}, ${projectId}, ${title}, ${description}, ${severityCode}, ${session.partyId}, ${recipientParty}, ${session.userAccountId}, ${session.userAccountId})
      returning id
    `;
    const issueId = issueRows[0].id;
    await sql`
      insert into bim.issue_event (organization_id, issue_id, event_code, actor_party_id) values (${ECOBIM_ORG_ID}, ${issueId}, 'CREATED', ${session.partyId})
    `;
    return { issueId };
  });

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ id: result.issueId }, { status: 201 });
}
