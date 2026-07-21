import { NextResponse } from "next/server";
import { destroySession } from "@/lib/server/session";
import { withErrorLogging } from "@/lib/server/api-error";

export async function POST() {
  return withErrorLogging("POST /api/auth/logout", async () => {
    await destroySession();
    return NextResponse.json({ ok: true });
  });
}
