"use client";

import type { ApiApproval } from "@/app/api/approvals/route";

export type { ApiApproval };

export async function fetchApprovals(): Promise<ApiApproval[]> {
  try {
    const res = await fetch("/api/approvals");
    if (!res.ok) return [];
    const data = (await res.json()) as { approvals?: ApiApproval[] };
    return data.approvals || [];
  } catch {
    return [];
  }
}

export async function createApprovalRequest(params: { title: string; projectName?: string; note?: string }): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) return { ok: false, error: data.error || "Couldn't request approval." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't reach the server. Please try again." };
  }
}

export type ApprovalAction = "SUGGEST_UPDATES" | "SEND_TO_CLIENT" | "APPROVE" | "REQUEST_REVISION" | "REMIND";

export async function transitionApproval(id: string, action: ApprovalAction, note?: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/approvals/${id}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) return { ok: false, error: data.error || "Couldn't complete that action." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't reach the server. Please try again." };
  }
}
