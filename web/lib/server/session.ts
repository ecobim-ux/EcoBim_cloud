import "server-only";
import { cookies } from "next/headers";
import { withOrgContext } from "./db-context";
import { ECOBIM_ORG_ID } from "./org";
import { roleCodeToKey } from "./role-mapping";

export { roleCodeToKey } from "./role-mapping";

export const SESSION_COOKIE = "ecobim_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export interface PortalSession {
  userAccountId: string;
  partyId: string;
  displayName: string;
  /** portal role key: admin | teamlead | employee | client */
  role: string;
}

export async function createSession(userAccountId: string): Promise<void> {
  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await withOrgContext(ECOBIM_ORG_ID, userAccountId, async (sql) => {
    await sql`
      insert into iam.auth_session (organization_id, user_account_id, token_hash, expires_at)
      values (${ECOBIM_ORG_ID}, ${userAccountId}, ${tokenHash}, ${expiresAt.toISOString()})
    `;
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const tokenHash = await sha256Hex(token);
    await withOrgContext(ECOBIM_ORG_ID, null, async (sql) => {
      await sql`update iam.auth_session set revoked_at = now() where token_hash = ${tokenHash}`;
    });
  }
  jar.delete(SESSION_COOKIE);
}

/** Revokes every active session for this account (not just the current
    device) — there was previously no way for a user to end a session left
    open elsewhere short of waiting out the flat 7-day cookie. */
export async function destroyAllSessions(userAccountId: string): Promise<void> {
  await withOrgContext(ECOBIM_ORG_ID, userAccountId, async (sql) => {
    await sql`update iam.auth_session set revoked_at = now() where user_account_id = ${userAccountId} and revoked_at is null`;
  });
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<PortalSession | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const tokenHash = await sha256Hex(token);

  return withOrgContext(ECOBIM_ORG_ID, null, async (sql) => {
    const rows = await sql<
      { user_account_id: string; party_id: string; display_name: string; role_code: string }[]
    >`
      select ua.id as user_account_id, ua.party_id, p.display_name,
             min(r.code) as role_code
      from iam.auth_session s
      join iam.user_account ua on ua.id = s.user_account_id
      join party.party p on p.id = ua.party_id
      join iam.user_role ur on ur.user_account_id = ua.id
      join iam.role r on r.id = ur.role_id
      where s.token_hash = ${tokenHash}
        and s.revoked_at is null
        and s.expires_at > now()
        and ua.deleted_at is null
      group by ua.id, ua.party_id, p.display_name
      limit 1
    `;
    const row = rows[0];
    if (!row) return null;
    return {
      userAccountId: row.user_account_id,
      partyId: row.party_id,
      displayName: row.display_name,
      role: roleCodeToKey(row.role_code),
    };
  });
}
