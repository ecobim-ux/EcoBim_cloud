import "server-only";
import type { TransactionSql } from "postgres";

/**
 * Creates one comms.notification plus a per-recipient comms.notification_delivery
 * row for each resolved login. Unknown logins are silently skipped rather than
 * failing the whole call — a notification is a side effect of some other action
 * succeeding, and one bad recipient shouldn't roll that action back.
 */
export async function notifyLogins(
  sql: TransactionSql,
  orgId: string,
  params: { recipientLoginIds: string[]; eventCode: string; title: string; body: string; deepLink?: string | null; createdBy?: string | null },
): Promise<void> {
  const logins = [...new Set(params.recipientLoginIds.filter(Boolean))];
  if (logins.length === 0) return;

  // sql.array()/ANY() needs postgres.js's type cache to encode the array
  // correctly, which is disabled (fetch_types: false, see db.ts) for
  // Hyperdrive compatibility. sql(array) as an IN-list works without it —
  // each element is bound as its own scalar parameter instead.
  const recipients = await sql<{ id: string }[]>`
    select id from iam.user_account where login_id in ${sql(logins)} and deleted_at is null
  `;
  if (recipients.length === 0) return;

  const notifRows = await sql<{ id: string }[]>`
    insert into comms.notification (organization_id, event_code, title, body, deep_link, created_by)
    values (${orgId}, ${params.eventCode}, ${params.title}, ${params.body}, ${params.deepLink ?? null}, ${params.createdBy ?? null})
    returning id
  `;
  const notificationId = notifRows[0].id;

  for (const r of recipients) {
    await sql`
      insert into comms.notification_delivery (organization_id, notification_id, user_account_id)
      values (${orgId}, ${notificationId}, ${r.id})
    `;
  }
}
