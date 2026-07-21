import "server-only";
import { NextResponse } from "next/server";
import type { TransactionSql } from "postgres";
import { ECOBIM_ORG_ID } from "./org";

/** Generic sliding-window rate limit backed by iam.action_attempt (0020) —
    the same durable-counter pattern as login's rate limiting, extended
    beyond login since every write endpoint was previously unlimited.
    Must run inside the same withOrgContext transaction as the action it's
    guarding, so the logged attempt and the guarded write share one
    connection/org context. */
export async function checkRateLimit(
  sql: TransactionSql,
  userAccountId: string,
  actionCode: string,
  opts: { windowMinutes: number; maxAttempts: number },
): Promise<NextResponse | null> {
  const rows = await sql<{ count: string }[]>`
    select count(*) from iam.action_attempt
    where organization_id = ${ECOBIM_ORG_ID}
      and user_account_id = ${userAccountId}
      and action_code = ${actionCode}
      and attempted_at > now() - (${opts.windowMinutes} * interval '1 minute')
  `;
  await sql`
    insert into iam.action_attempt (organization_id, user_account_id, action_code)
    values (${ECOBIM_ORG_ID}, ${userAccountId}, ${actionCode})
  `;
  if (Number(rows[0]?.count ?? 0) >= opts.maxAttempts) {
    return NextResponse.json({ error: "You're doing that too often. Please wait a bit and try again." }, { status: 429 });
  }
  return null;
}
