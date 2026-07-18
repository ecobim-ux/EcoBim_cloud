import "server-only";
import type { Sql, TransactionSql } from "postgres";
import { getDb } from "./db";

/**
 * Runs `fn` inside a transaction with `app.org_id` / `app.user_id` set as
 * transaction-local GUCs, matching what the RLS policies in
 * db/migrations/0016_triggers_rls_grants.sql read via
 * core.current_org_id() / core.current_user_id(). Using set_config(...,
 * true) inside a transaction (rather than a bare SET) guarantees the value
 * only applies to this transaction's connection and is never leaked to
 * another request that reuses the same pooled connection afterwards.
 */
export async function withOrgContext<T>(
  orgId: string,
  userId: string | null,
  fn: (sql: TransactionSql) => Promise<T>,
): Promise<T> {
  const db = await getDb();
  try {
    const result = await db.begin(async (sql) => {
      await sql`select set_config('app.org_id', ${orgId}, true)`;
      if (userId) {
        await sql`select set_config('app.user_id', ${userId}, true)`;
      }
      return fn(sql);
    });
    return result as T;
  } finally {
    await db.end({ timeout: 0 });
  }
}

/** For pre-auth queries (login) that must run before an org/user is known. */
export async function withoutOrgContext<T>(fn: (sql: Sql) => Promise<T>): Promise<T> {
  const db = await getDb();
  try {
    return await fn(db);
  } finally {
    await db.end({ timeout: 0 });
  }
}
