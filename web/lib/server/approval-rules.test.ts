import { describe, expect, it } from "vitest";
import { canPerformApprovalAction, APPROVAL_ACTION_RULES } from "./approval-rules";

describe("approval workflow permission matrix", () => {
  it("only admin may suggest updates, send to client, or send a reminder", () => {
    for (const action of ["SUGGEST_UPDATES", "SEND_TO_CLIENT", "REMIND"]) {
      expect(canPerformApprovalAction("admin", action)).toBe(true);
      expect(canPerformApprovalAction("teamlead", action)).toBe(false);
      expect(canPerformApprovalAction("employee", action)).toBe(false);
      expect(canPerformApprovalAction("client", action)).toBe(false);
    }
  });

  it("only client may request a revision", () => {
    expect(canPerformApprovalAction("client", "REQUEST_REVISION")).toBe(true);
    expect(canPerformApprovalAction("admin", "REQUEST_REVISION")).toBe(false);
    expect(canPerformApprovalAction("teamlead", "REQUEST_REVISION")).toBe(false);
  });

  it("admin and client may both approve, but no one else", () => {
    expect(canPerformApprovalAction("admin", "APPROVE")).toBe(true);
    expect(canPerformApprovalAction("client", "APPROVE")).toBe(true);
    expect(canPerformApprovalAction("teamlead", "APPROVE")).toBe(false);
    expect(canPerformApprovalAction("employee", "APPROVE")).toBe(false);
  });

  it("team lead has no allowed transition actions at all — read-only by design", () => {
    for (const action of Object.keys(APPROVAL_ACTION_RULES)) {
      expect(canPerformApprovalAction("teamlead", action)).toBe(false);
    }
  });

  it("rejects an action code that doesn't exist in the workflow", () => {
    expect(canPerformApprovalAction("admin", "DELETE_EVERYTHING")).toBe(false);
  });

  it("APPROVE is the only terminal action — it's the one that closes the workflow instance", () => {
    const terminalActions = Object.entries(APPROVAL_ACTION_RULES)
      .filter(([, rule]) => rule.terminal)
      .map(([action]) => action);
    expect(terminalActions).toEqual(["APPROVE"]);
  });
});
