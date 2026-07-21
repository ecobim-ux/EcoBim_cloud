"use client";

import type { ApiLead } from "@/app/api/leads/route";
import { reportFetchError } from "./fetch-error";

export type { ApiLead };

export async function fetchLeads(): Promise<ApiLead[]> {
  try {
    const res = await fetch("/api/leads");
    if (!res.ok) {
      reportFetchError("requests", new Error(`HTTP ${res.status}`));
      return [];
    }
    const data = (await res.json()) as { leads?: ApiLead[] };
    return data.leads || [];
  } catch (err) {
    reportFetchError("requests", err);
    return [];
  }
}

export async function markLeadContacted(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/leads/${id}/contact`, { method: "POST" });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) return { ok: false, error: data.error || "Couldn't update that request." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't reach the server. Please try again." };
  }
}

export async function assignLeadToTeamLead(id: string, teamLeadLoginId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/leads/${id}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamLeadLoginId }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) return { ok: false, error: data.error || "Couldn't assign that request." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't reach the server. Please try again." };
  }
}

export async function delegateLeadToEmployee(id: string, employeeLoginId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/leads/${id}/delegate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeLoginId }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) return { ok: false, error: data.error || "Couldn't assign that request." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't reach the server. Please try again." };
  }
}
