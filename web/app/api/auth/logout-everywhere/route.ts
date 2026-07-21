import { NextResponse } from "next/server";
import { requireSession } from "@/lib/server/auth-guard";
import { destroyAllSessions } from "@/lib/server/session";
import { withErrorLogging } from "@/lib/server/api-error";

/** POST /api/auth/logout-everywhere — revokes every session on the caller's
    own account, including this one. Self-service only (no admin-on-behalf-
    of-another-user variant) — the audit finding this closes is "a user has
    no way to end a session left open on another device." */
export async function POST() {
  return withErrorLogging("POST /api/auth/logout-everywhere", async () => {
    const auth = await requireSession();
    if ("error" in auth) return auth.error;

    await destroyAllSessions(auth.session.userAccountId);
    return NextResponse.json({ ok: true });
  });
}
