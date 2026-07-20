import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireRole, requireSession } from "@/lib/server/auth-guard";
import { withOrgContext } from "@/lib/server/db-context";
import { ECOBIM_ORG_ID } from "@/lib/server/org";

/** POST /api/clients — admin only. Onboards a real client: a company party,
    a contact-person party (+ optional real login), and a crm.client_account
    linking them to the chosen team lead — replacing the old flow that only
    ever wrote a plaintext-password record to localStorage and nothing else
    (the "client" it created was never visible anywhere but the admin's own
    browser). Also creates a bare proj.project row for the client so their
    portal has somewhere real to attach milestones/RFIs/approvals to as work
    starts — deliberately minimal (no phases/milestones fabricated). */
export async function POST(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const forbidden = requireRole(session, ["admin"]);
  if (forbidden) return forbidden;

  const body = (await req.json().catch(() => null)) as {
    name?: string;
    company?: string;
    email?: string;
    teamLeadLoginId?: string;
    loginId?: string;
    password?: string;
  } | null;

  const name = body?.name?.trim();
  const email = body?.email?.trim();
  const teamLeadLoginId = body?.teamLeadLoginId?.trim();
  if (!name || !email) {
    return NextResponse.json({ error: "A contact name and email are required." }, { status: 400 });
  }
  const company = body?.company?.trim() || name;

  const loginId = body?.loginId?.trim();
  const password = body?.password?.trim();
  if (loginId && (!password || password.length < 4)) {
    return NextResponse.json({ error: "Password must be at least 4 characters." }, { status: 400 });
  }

  const result = await withOrgContext(ECOBIM_ORG_ID, session.userAccountId, async (sql) => {
    let ownerEmployeeId: string | null = null;
    if (teamLeadLoginId) {
      const leadRows = await sql<{ id: string }[]>`
        select e.id from hr.employee e
        join iam.user_account ua on ua.party_id = e.person_id and ua.deleted_at is null
        where ua.login_id = ${teamLeadLoginId} and e.organization_id = ${ECOBIM_ORG_ID}
      `;
      ownerEmployeeId = leadRows[0]?.id ?? null;
      if (!ownerEmployeeId) return { error: "That team lead couldn't be found." as const };
    }

    if (loginId) {
      const existing = await sql<{ id: string }[]>`
        select id from iam.user_account where organization_id = ${ECOBIM_ORG_ID} and login_id = ${loginId} and deleted_at is null
      `;
      if (existing.length > 0) return { error: "That login ID is already taken." as const };
    }

    const orgPartyRows = await sql<{ id: string }[]>`
      insert into party.party (organization_id, kind, display_name) values (${ECOBIM_ORG_ID}, 'ORG', ${company}) returning id
    `;
    const partyOrgId = orgPartyRows[0].id;

    const nameParts = name.split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || null;
    const contactPartyRows = await sql<{ id: string }[]>`
      insert into party.party (organization_id, kind, display_name) values (${ECOBIM_ORG_ID}, 'PERSON', ${name}) returning id
    `;
    const contactPartyId = contactPartyRows[0].id;
    await sql`insert into party.person (party_id, first_name, last_name) values (${contactPartyId}, ${firstName}, ${lastName})`;
    await sql`insert into party.contact_point (organization_id, party_id, kind, value, is_primary) values (${ECOBIM_ORG_ID}, ${contactPartyId}, 'EMAIL', ${email}, true)`;
    await sql`insert into party.party_role (organization_id, party_id, role_code) values (${ECOBIM_ORG_ID}, ${contactPartyId}, 'CLIENT')`;

    let createdLogin: { loginId: string; password: string } | null = null;
    if (loginId && password) {
      const roleRows = await sql<{ id: string }[]>`select id from iam.role where code = 'CLIENT' and organization_id is null`;
      const roleId = roleRows[0]?.id;
      if (!roleId) return { error: "Client role isn't configured." as const };

      const secretHash = await bcrypt.hash(password, 12);
      const userRows = await sql<{ id: string }[]>`
        insert into iam.user_account (organization_id, party_id, login_id, status) values (${ECOBIM_ORG_ID}, ${contactPartyId}, ${loginId}, 'ACTIVE') returning id
      `;
      const userAccountId = userRows[0].id;
      await sql`
        insert into iam.credential (organization_id, user_account_id, kind, secret_hash, algo) values (${ECOBIM_ORG_ID}, ${userAccountId}, 'PASSWORD', ${secretHash}, 'bcrypt')
      `;
      await sql`insert into iam.user_role (user_account_id, role_id, granted_by) values (${userAccountId}, ${roleId}, ${session.userAccountId})`;
      createdLogin = { loginId, password };
    }

    const clientCode = "CLT-" + Date.now().toString().slice(-9);
    const clientRows = await sql<{ id: string }[]>`
      insert into crm.client_account (organization_id, code, party_org_id, primary_contact_party_id, owner_employee_id, onboarded_on)
      values (${ECOBIM_ORG_ID}, ${clientCode}, ${partyOrgId}, ${contactPartyId}, ${ownerEmployeeId}, current_date)
      returning id
    `;
    const clientAccountId = clientRows[0].id;

    const projectCode = "PRJ-" + Date.now().toString().slice(-9);
    await sql`
      insert into proj.project (organization_id, code, name, client_account_id, lead_employee_id, status_code)
      values (${ECOBIM_ORG_ID}, ${projectCode}, ${company}, ${clientAccountId}, ${ownerEmployeeId}, 'ACTIVE')
    `;

    return { clientAccountId, ...createdLogin };
  });

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result, { status: 201 });
}
