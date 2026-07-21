import { describe, expect, it } from "vitest";
import { roleCodeToKey } from "./role-mapping";

describe("roleCodeToKey", () => {
  it("maps every seeded iam.role code to its portal role key", () => {
    expect(roleCodeToKey("ADMIN")).toBe("admin");
    expect(roleCodeToKey("TEAM_LEAD")).toBe("teamlead");
    expect(roleCodeToKey("EMPLOYEE")).toBe("employee");
    expect(roleCodeToKey("CLIENT")).toBe("client");
  });

  it("falls back to a lowercased code for anything unrecognized, rather than throwing", () => {
    expect(roleCodeToKey("SOME_FUTURE_ROLE")).toBe("some_future_role");
  });
});
