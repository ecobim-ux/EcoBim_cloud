import { NextResponse } from "next/server";
import { requireSession } from "@/lib/server/auth-guard";
import { withOrgContext } from "@/lib/server/db-context";
import { ECOBIM_ORG_ID } from "@/lib/server/org";
import { withErrorLogging } from "@/lib/server/api-error";

/** POST /api/issues/:id/respond — anyone signed in may respond (matches
    the previous behavior); a real permission model for "who may respond to
    this specific issue" (raiser/routed-to/admin) can be tightened later. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorLogging("POST /api/issues/:id/respond", async () => {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;

  const { id: issueId } = await params;
  const body = (await req.json().catch(() => null)) as { response?: string } | null;
  const response = body?.response?.trim();
  if (!response) {
    return NextResponse.json({ error: "A response is required." }, { status: 400 });
  }

  await withOrgContext(ECOBIM_ORG_ID, session.userAccountId, async (sql) => {
    await sql`
      insert into bim.issue_event (organization_id, issue_id, event_code, actor_party_id, body)
      values (${ECOBIM_ORG_ID}, ${issueId}, 'RESPONDED', ${session.partyId}, ${response})
    `;
  });

  return NextResponse.json({ ok: true });
  });
}
