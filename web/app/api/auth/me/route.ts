import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ session: null });
  return NextResponse.json({ session: { role: session.role, name: session.displayName } });
}
