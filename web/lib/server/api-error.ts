import "server-only";
import { NextResponse } from "next/server";

/** Every route handler previously had no top-level error boundary at all —
    an uncaught exception (DB timeout, constraint violation, bug) fell
    through to Next's default handling with nothing logged anywhere and a
    bare, undiagnosable failure on the client. Wrap the handler body in this
    so every route logs what actually broke and returns a clean 500 instead
    of leaking a stack trace or silently vanishing. */
export async function withErrorLogging<T>(routeLabel: string, fn: () => Promise<T>): Promise<T | NextResponse> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[api] ${routeLabel} failed:`, err);
    return NextResponse.json({ error: "Something went wrong on our end. Please try again." }, { status: 500 });
  }
}
