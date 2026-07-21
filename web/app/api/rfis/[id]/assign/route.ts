import { NextResponse } from "next/server";
import { requireRole, requireSession } from "@/lib/server/auth-guard";
import { withOrgContext } from "@/lib/server/db-context";
import { ECOBIM_ORG_ID } from "@/lib/server/org";
import { withErrorLogging } from "@/lib/server/api-error";

/** POST /api/rfis/:id/assign — admin/team lead only. Assigns an employee to
    answer the RFI internally (bim.rfi.assignee_person_id) — was previously
    a dropdown that didn't persist anywhere. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorLogging("POST /api/rfis/:id/assign", async () => {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const forbidden = requireRole(session, ["admin", "teamlead"]);
  if (forbidden) return forbidden;

  const { id: rfiId } = await params;
  const body = (await req.json().catch(() => null)) as { assigneeLoginId?: string } | null;
  const assigneeLoginId = body?.assigneeLoginId?.trim();
  if (!assigneeLoginId) {
    return NextResponse.json({ error: "An assignee is required." }, { status: 400 });
  }

  const result = await withOrgContext(ECOBIM_ORG_ID, session.userAccountId, async (sql) => {
    const assigneeRows = await sql<{ party_id: string }[]>`
      select party_id from iam.user_account where login_id = ${assigneeLoginId} and deleted_at is null
    `;
    const assigneeParty = assigneeRows[0]?.party_id;
    if (!assigneeParty) return { error: "That person couldn't be found." as const };

    await sql`
      update bim.rfi set assignee_person_id = ${assigneeParty}, updated_by = ${session.userAccountId}
      where id = ${rfiId} and organization_id = ${ECOBIM_ORG_ID} and deleted_at is null
    `;
    return { ok: true as const };
  });

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
  });
}
