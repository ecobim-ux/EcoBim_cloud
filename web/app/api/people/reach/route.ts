import { NextResponse } from "next/server";
import { requireRole, requireSession } from "@/lib/server/auth-guard";
import { withOrgContext } from "@/lib/server/db-context";
import { ECOBIM_ORG_ID } from "@/lib/server/org";

const POSITION_TO_ROLE: Record<string, string> = { admin: "ADMIN", teamlead: "TEAM_LEAD", employee: "EMPLOYEE", client: "CLIENT" };

/** POST /api/people/reach — admin only. Toggles whether `from` may invite
    `to` to a meeting, upserting iam.interaction_policy. */
export async function POST(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { session } = auth;
  const forbidden = requireRole(session, ["admin"]);
  if (forbidden) return forbidden;

  const body = (await req.json().catch(() => null)) as { from?: string; to?: string; allowed?: boolean } | null;
  const fromCode = body?.from ? POSITION_TO_ROLE[body.from] : undefined;
  const toCode = body?.to ? POSITION_TO_ROLE[body.to] : undefined;
  const allowed = body?.allowed;
  if (!fromCode || !toCode || typeof allowed !== "boolean") {
    return NextResponse.json({ error: "from, to and allowed are required." }, { status: 400 });
  }

  await withOrgContext(ECOBIM_ORG_ID, session.userAccountId, async (sql) => {
    const fromRole = await sql<{ id: string }[]>`select id from iam.role where code = ${fromCode} and organization_id is null`;
    const toRole = await sql<{ id: string }[]>`select id from iam.role where code = ${toCode} and organization_id is null`;
    if (!fromRole[0] || !toRole[0]) return;

    await sql`
      insert into iam.interaction_policy (organization_id, from_role_id, to_role_id, interaction_code, allowed, updated_by)
      values (${ECOBIM_ORG_ID}, ${fromRole[0].id}, ${toRole[0].id}, 'MEETING_INVITE', ${allowed}, ${session.userAccountId})
      on conflict (organization_id, from_role_id, to_role_id, interaction_code) where deleted_at is null
      do update set allowed = excluded.allowed, updated_at = now(), updated_by = excluded.updated_by
    `;
  });

  return NextResponse.json({ ok: true });
}
