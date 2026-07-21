import { describe, expect, it } from "vitest";
import { requireRole } from "./auth-guard";
import type { PortalSession } from "./session";

function sessionAs(role: string): PortalSession {
  return { userAccountId: "u1", partyId: "p1", displayName: "Test User", role };
}

describe("requireRole", () => {
  it("returns null (no rejection) when the session's role is in the allowed list", () => {
    expect(requireRole(sessionAs("admin"), ["admin", "teamlead"])).toBeNull();
  });

  it("returns a 403 NextResponse when the session's role is not allowed", async () => {
    const result = requireRole(sessionAs("employee"), ["admin", "teamlead"]);
    expect(result).not.toBeNull();
    expect(result?.status).toBe(403);
    const body = (await result?.json()) as { error: string };
    expect(body.error).toBe("You don't have permission to do that.");
  });

  it("rejects when the allowed list is empty — matches team lead having zero approval actions", () => {
    const result = requireRole(sessionAs("teamlead"), []);
    expect(result?.status).toBe(403);
  });
});
