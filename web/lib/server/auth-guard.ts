import "server-only";
import { NextResponse } from "next/server";
import { getSession, type PortalSession } from "./session";
import { withOrgContext } from "./db-context";
import { ECOBIM_ORG_ID } from "./org";

/**
 * Every non-auth API route must call this first — this is the authorization
 * checkpoint flagged as missing in the production-readiness audit (no route
 * should be reachable without an explicit session check, and this makes
 * skipping that check require deliberately not calling this helper rather
 * than just forgetting a line).
 */
export async function requireSession(): Promise<{ session: PortalSession } | { error: NextResponse }> {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Not signed in." }, { status: 401 }) };
  }
  return { session };
}

export function requireRole(
  session: PortalSession,
  allowed: string[],
): NextResponse | null {
  if (!allowed.includes(session.role)) {
    return NextResponse.json({ error: "You don't have permission to do that." }, { status: 403 });
  }
  return null;
}

/** Resolves hr.employee.id from a session's party id — needed for anything
    that writes timelog.time_entry (which references hr.employee, not the
    party directly). Returns null for roles with no employee row (clients). */
export async function resolveEmployeeId(partyId: string): Promise<string | null> {
  return withOrgContext(ECOBIM_ORG_ID, null, async (sql) => {
    const rows = await sql<{ id: string }[]>`
      select id from hr.employee where person_id = ${partyId} and deleted_at is null
    `;
    return rows[0]?.id ?? null;
  });
}
