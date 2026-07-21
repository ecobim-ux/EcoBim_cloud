import { NextResponse } from "next/server";
import { requireSession } from "@/lib/server/auth-guard";
import { withOrgContext } from "@/lib/server/db-context";
import { ECOBIM_ORG_ID } from "@/lib/server/org";
import { withErrorLogging } from "@/lib/server/api-error";

/** POST /api/rfis/:id/respond — anyone signed in may respond (matches the
    previous behavior of the shared status/response mechanism); records the
    response and marks the RFI Responded unless it's already Closed. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorLogging("POST /api/rfis/:id/respond", async () => {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const { id: rfiId } = await params;
  const body = (await req.json().catch(() => null)) as { response?: string } | null;
  const response = body?.response?.trim();
  if (!response) {
    return NextResponse.json({ error: "A response is required." }, { status: 400 });
  }

  await withOrgContext(ECOBIM_ORG_ID, session.userAccountId, async (sql) => {
    await sql`
      insert into bim.rfi_response (organization_id, rfi_id, author_party_id, body) values (${ECOBIM_ORG_ID}, ${rfiId}, ${session.partyId}, ${response})
    `;
    await sql`
      update bim.rfi set status_code = 'RESPONDED', updated_by = ${session.userAccountId}
      where id = ${rfiId} and organization_id = ${ECOBIM_ORG_ID} and deleted_at is null and status_code <> 'CLOSED'
    `;
  });

  return NextResponse.json({ ok: true });
  });
}
