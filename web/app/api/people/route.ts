import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireRole, requireSession } from "@/lib/server/auth-guard";
import { withOrgContext } from "@/lib/server/db-context";
import { z } from "zod";
import { ECOBIM_ORG_ID } from "@/lib/server/org";
import { withErrorLogging } from "@/lib/server/api-error";
import { parseBody, requiredString } from "@/lib/server/validate";

export interface ApiPerson {
  partyId: string;
  name: string;
  initials: string;
  email: string | null;
  position: string;
  loginId: string;
  status: string;
  /** Employees only — the team lead they currently report to, if assigned. */
  teamLeadLoginId: string | null;
  teamLeadName: string | null;
}

const POSITION_TO_ROLE: Record<string, string> = { admin: "ADMIN", teamlead: "TEAM_LEAD", employee: "EMPLOYEE", client: "CLIENT" };
const ROLE_TO_POSITION: Record<string, string> = { ADMIN: "admin", TEAM_LEAD: "teamlead", EMPLOYEE: "employee", CLIENT: "client" };
const POSITIONS = Object.keys(POSITION_TO_ROLE);

const CreatePersonSchema = z.object({
  name: requiredString("A name is required.", 200),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  position: z.string().refine((p) => POSITIONS.includes(p), { message: "A valid position is required." }),
  loginId: z.string().trim().optional(),
  password: z.string().optional(),
});

function initialsOf(name: string): string {
  const w = name.trim().split(/\s+/);
  return (((w[0] || "")[0] || "") + ((w[1] || "")[0] || (w[0] || "")[1] || "")).toUpperCase() || "?";
}

interface PersonRow {
  party_id: string;
  display_name: string;
  email: string | null;
  login_id: string;
  status: string;
  role_code: string;
  team_lead_login_id: string | null;
  team_lead_name: string | null;
}

interface PolicyRow {
  from_code: string;
  to_code: string;
}

/** GET /api/people — any signed-in user. Staff (admin/teamlead/employee) get
    the full roster for colleague-lookup purposes (routing a ping/
    notification to their team lead, picking a meeting attendee, etc.) — the
    same job the old localStorage People mirror served. Clients get the same
    endpoint (needed to pick a meeting attendee themselves) but with every
    other client account filtered out below, since they must never see
    another client's contact info. Never returns credential material — the
    admin table used to show every password in plaintext, which the audit
    flagged as critical; passwords are now shown once, at creation time. */
export async function GET() {
  return withErrorLogging("GET /api/people", async () => {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const { people, policies } = await withOrgContext(ECOBIM_ORG_ID, session.userAccountId, async (sql) => {
    const people = await sql<PersonRow[]>`
      select p.id as party_id, p.display_name, ua.login_id, ua.status,
             (select cp.value from party.contact_point cp where cp.party_id = p.id and cp.kind = 'EMAIL' and cp.is_primary and cp.deleted_at is null limit 1) as email,
             min(r.code) as role_code,
             lead_ua.login_id as team_lead_login_id,
             lead_party.display_name as team_lead_name
      from party.party p
      join iam.user_account ua on ua.party_id = p.id and ua.deleted_at is null
      join iam.user_role ur on ur.user_account_id = ua.id
      join iam.role r on r.id = ur.role_id
      left join hr.employee emp on emp.person_id = p.id and emp.deleted_at is null
      left join lateral (
        select t.lead_employee_id from hr.team_member tm
        join hr.team t on t.id = tm.team_id and t.deleted_at is null
        where tm.employee_id = emp.id and tm.left_on is null and tm.deleted_at is null
        limit 1
      ) team_link on true
      left join hr.employee lead_emp on lead_emp.id = team_link.lead_employee_id and lead_emp.deleted_at is null
      left join party.party lead_party on lead_party.id = lead_emp.person_id
      left join iam.user_account lead_ua on lead_ua.party_id = lead_party.id and lead_ua.deleted_at is null
      where p.organization_id = ${ECOBIM_ORG_ID} and p.deleted_at is null
      group by p.id, p.display_name, ua.login_id, ua.status, lead_ua.login_id, lead_party.display_name
      order by p.display_name
      limit 500
    `;
    const policies = await sql<PolicyRow[]>`
      select fr.code as from_code, tr.code as to_code
      from iam.interaction_policy ip
      join iam.role fr on fr.id = ip.from_role_id
      join iam.role tr on tr.id = ip.to_role_id
      where ip.organization_id = ${ECOBIM_ORG_ID} and ip.interaction_code = 'MEETING_INVITE' and ip.allowed and ip.deleted_at is null
    `;
    return { people, policies };
  });

  const reach: Record<string, string[]> = {};
  for (const p of policies) {
    const from = ROLE_TO_POSITION[p.from_code];
    const to = ROLE_TO_POSITION[p.to_code];
    if (!from || !to) continue;
    (reach[from] ??= []).push(to);
  }

  let apiPeople: ApiPerson[] = people.map((p) => ({
    partyId: p.party_id,
    name: p.display_name,
    initials: initialsOf(p.display_name),
    email: p.email,
    position: ROLE_TO_POSITION[p.role_code] ?? p.role_code.toLowerCase(),
    loginId: p.login_id,
    status: p.status,
    teamLeadLoginId: p.team_lead_login_id,
    teamLeadName: p.team_lead_name,
  }));
  if (session.role === "client") {
    apiPeople = apiPeople.filter((p) => p.position !== "client");
  }

  return NextResponse.json({ people: apiPeople, reach });
  });
}

/** POST /api/people — admin only. Creates a real party+user_account+bcrypt
    credential+role grant (and an hr.employee row for staff positions) —
    replacing the old flow that only ever wrote a plaintext password to
    localStorage. */
export async function POST(req: Request) {
  return withErrorLogging("POST /api/people", async () => {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const forbidden = requireRole(session, ["admin", "teamlead"]);
  if (forbidden) return forbidden;

  const parsed = await parseBody(req, CreatePersonSchema);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;

  const name = body.name;
  const email = body.email;
  const position = body.position;
  // Team leads can only add employees to their own team — admin-only
  // positions and client accounts stay gated to admin.
  if (session.role === "teamlead" && position !== "employee") {
    return NextResponse.json({ error: "Team leads can only add employees." }, { status: 403 });
  }
  const loginId = body.loginId?.trim() || name.split(/\s+/)[0].toLowerCase();
  const password = body.password?.trim() || "ecobim@1";
  if (password.length < 4) {
    return NextResponse.json({ error: "Password must be at least 4 characters." }, { status: 400 });
  }

  const roleCode = POSITION_TO_ROLE[position];
  const secretHash = await bcrypt.hash(password, 12);
  const nameParts = name.split(/\s+/);
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ") || null;

  const result = await withOrgContext(ECOBIM_ORG_ID, auth.session.userAccountId, async (sql) => {
    const existing = await sql<{ id: string }[]>`
      select id from iam.user_account where organization_id = ${ECOBIM_ORG_ID} and login_id = ${loginId} and deleted_at is null
    `;
    if (existing.length > 0) return { error: "That login ID is already taken." as const };

    const roleRows = await sql<{ id: string }[]>`select id from iam.role where code = ${roleCode} and organization_id is null`;
    const roleId = roleRows[0]?.id;
    if (!roleId) return { error: "Unknown position." as const };

    const partyRows = await sql<{ id: string }[]>`
      insert into party.party (organization_id, kind, display_name) values (${ECOBIM_ORG_ID}, 'PERSON', ${name}) returning id
    `;
    const partyId = partyRows[0].id;

    await sql`insert into party.person (party_id, first_name, last_name) values (${partyId}, ${firstName}, ${lastName})`;
    await sql`insert into party.contact_point (organization_id, party_id, kind, value, is_primary) values (${ECOBIM_ORG_ID}, ${partyId}, 'EMAIL', ${email}, true)`;

    const userRows = await sql<{ id: string }[]>`
      insert into iam.user_account (organization_id, party_id, login_id, status) values (${ECOBIM_ORG_ID}, ${partyId}, ${loginId}, 'ACTIVE') returning id
    `;
    const userAccountId = userRows[0].id;

    await sql`
      insert into iam.credential (organization_id, user_account_id, kind, secret_hash, algo) values (${ECOBIM_ORG_ID}, ${userAccountId}, 'PASSWORD', ${secretHash}, 'bcrypt')
    `;
    await sql`insert into iam.user_role (user_account_id, role_id, granted_by) values (${userAccountId}, ${roleId}, ${auth.session.userAccountId})`;

    if (position !== "client") {
      const employeeNo = "E-" + Date.now().toString().slice(-6);
      await sql`
        insert into hr.employee (organization_id, person_id, employee_no, hired_on) values (${ECOBIM_ORG_ID}, ${partyId}, ${employeeNo}, current_date)
      `;
    } else {
      await sql`insert into party.party_role (organization_id, party_id, role_code) values (${ECOBIM_ORG_ID}, ${partyId}, 'CLIENT')`;
    }

    return { partyId, loginId, password };
  });

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result, { status: 201 });
  });
}
