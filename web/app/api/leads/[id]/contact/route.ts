import { NextResponse } from "next/server";
import { requireRole, requireSession } from "@/lib/server/auth-guard";
import { withOrgContext } from "@/lib/server/db-context";
import { ECOBIM_ORG_ID } from "@/lib/server/org";

/** POST /api/leads/:id/contact — admin only. Marks the lead Contacted. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const forbidden = requireRole(session, ["admin"]);
  if (forbidden) return forbidden;

  const { id: leadId } = await params;

  await withOrgContext(ECOBIM_ORG_ID, session.userAccountId, async (sql) => {
    const rows = await sql<{ status_code: string }[]>`
      select status_code from crm.lead where id = ${leadId} and organization_id = ${ECOBIM_ORG_ID} and deleted_at is null
    `;
    const from = rows[0]?.status_code;
    if (!from) return;
    await sql`update crm.lead set status_code = 'CONTACTED', updated_by = ${session.userAccountId} where id = ${leadId}`;
    await sql`
      insert into crm.lead_status_history (organization_id, lead_id, from_status, to_status, changed_by)
      values (${ECOBIM_ORG_ID}, ${leadId}, ${from}, 'CONTACTED', ${session.userAccountId})
    `;
  });

  return NextResponse.json({ ok: true });
}
