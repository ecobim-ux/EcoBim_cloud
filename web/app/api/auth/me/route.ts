import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";
import { withErrorLogging } from "@/lib/server/api-error";

export async function GET() {
  return withErrorLogging("GET /api/auth/me", async () => {
    const session = await getSession();
    if (!session) return NextResponse.json({ session: null });
    return NextResponse.json({ session: { role: session.role, name: session.displayName } });
  });
}
