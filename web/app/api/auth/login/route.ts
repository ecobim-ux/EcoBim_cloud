import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { withOrgContext } from "@/lib/server/db-context";
import { ECOBIM_ORG_ID } from "@/lib/server/org";
import { createSession, roleCodeToKey } from "@/lib/server/session";

interface LoginRow {
  user_account_id: string;
  secret_hash: string;
  display_name: string;
  role_code: string;
}

const WINDOW_MINUTES = 15;
const MAX_ATTEMPTS_PER_LOGIN = 6;
const MAX_ATTEMPTS_PER_IP = 20;

function clientIp(req: Request): string {
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

async function recentFailureCounts(loginId: string, ip: string): Promise<{ byLogin: number; byIp: number }> {
  return withOrgContext(ECOBIM_ORG_ID, null, async (sql) => {
    const rows = await sql<{ by_login: string; by_ip: string }[]>`
      select
        count(*) filter (where login_id = ${loginId}) as by_login,
        count(*) filter (where ip_address = ${ip}) as by_ip
      from iam.login_attempt
      where organization_id = ${ECOBIM_ORG_ID}
        and not succeeded
        and attempted_at > now() - (${WINDOW_MINUTES} * interval '1 minute')
        and (login_id = ${loginId} or ip_address = ${ip})
    `;
    return { byLogin: Number(rows[0]?.by_login ?? 0), byIp: Number(rows[0]?.by_ip ?? 0) };
  });
}

async function recordAttempt(loginId: string, ip: string, succeeded: boolean): Promise<void> {
  await withOrgContext(ECOBIM_ORG_ID, null, async (sql) => {
    await sql`
      insert into iam.login_attempt (organization_id, login_id, ip_address, succeeded)
      values (${ECOBIM_ORG_ID}, ${loginId}, ${ip}, ${succeeded})
    `;
  });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { loginId?: string; password?: string } | null;
  const loginId = body?.loginId?.trim();
  const password = body?.password ?? "";
  if (!loginId || !password) {
    return NextResponse.json({ error: "User ID and password are required." }, { status: 400 });
  }

  const ip = clientIp(req);
  const { byLogin, byIp } = await recentFailureCounts(loginId, ip);
  if (byLogin >= MAX_ATTEMPTS_PER_LOGIN || byIp >= MAX_ATTEMPTS_PER_IP) {
    return NextResponse.json({ error: "Too many failed attempts. Please wait a few minutes and try again." }, { status: 429 });
  }

  const row = await withOrgContext(ECOBIM_ORG_ID, null, async (sql) => {
    const rows = await sql<LoginRow[]>`
      select ua.id as user_account_id, c.secret_hash, p.display_name,
             min(r.code) as role_code
      from iam.user_account ua
      join party.party p on p.id = ua.party_id
      join iam.credential c on c.user_account_id = ua.id and c.kind = 'PASSWORD' and c.is_active
      join iam.user_role ur on ur.user_account_id = ua.id
      join iam.role r on r.id = ur.role_id
      where ua.login_id = ${loginId}
        and ua.status = 'ACTIVE'
        and ua.deleted_at is null
      group by ua.id, c.secret_hash, p.display_name
      limit 1
    `;
    return rows[0] ?? null;
  });

  if (!row) {
    await recordAttempt(loginId, ip, false);
    return NextResponse.json({ error: "Incorrect ID or password. Please try again." }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, row.secret_hash);
  if (!valid) {
    await recordAttempt(loginId, ip, false);
    return NextResponse.json({ error: "Incorrect ID or password. Please try again." }, { status: 401 });
  }

  await recordAttempt(loginId, ip, true);
  await createSession(row.user_account_id);

  await withOrgContext(ECOBIM_ORG_ID, row.user_account_id, async (sql) => {
    await sql`update iam.user_account set last_login_at = now() where id = ${row.user_account_id}`;
  });

  return NextResponse.json({ role: roleCodeToKey(row.role_code), name: row.display_name });
}
