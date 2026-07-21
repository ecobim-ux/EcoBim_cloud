"use client";

import type { ApiPerson } from "@/app/api/people/route";
import { reportFetchError } from "./fetch-error";

export type { ApiPerson };

export const POS_LABEL: Record<string, string> = {
  admin: "Admin",
  teamlead: "Team Lead",
  employee: "Employee",
  client: "Freelance",
};
export const POS_ORDER = ["admin", "teamlead", "employee", "client"];

export interface PeopleData {
  people: ApiPerson[];
  reach: Record<string, string[]>;
}

export async function fetchPeople(): Promise<PeopleData> {
  try {
    const res = await fetch("/api/people");
    if (!res.ok) {
      reportFetchError("people", new Error(`HTTP ${res.status}`));
      return { people: [], reach: {} };
    }
    return (await res.json()) as PeopleData;
  } catch (err) {
    reportFetchError("people", err);
    return { people: [], reach: {} };
  }
}

export async function createPerson(params: { name: string; email: string; position: string; loginId?: string; password?: string }): Promise<{ ok: boolean; error?: string; loginId?: string; password?: string }> {
  try {
    const res = await fetch("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = (await res.json()) as { error?: string; loginId?: string; password?: string };
    if (!res.ok) return { ok: false, error: data.error || "Couldn't create that account." };
    return { ok: true, loginId: data.loginId, password: data.password };
  } catch {
    return { ok: false, error: "Couldn't reach the server. Please try again." };
  }
}

export async function deactivatePerson(partyId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/people/${partyId}/deactivate`, { method: "POST" });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) return { ok: false, error: data.error || "Couldn't remove that account." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't reach the server. Please try again." };
  }
}

export async function assignTeamLead(partyId: string, teamLeadLoginId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/people/${partyId}/team-lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamLeadLoginId }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) return { ok: false, error: data.error || "Couldn't assign that team lead." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't reach the server. Please try again." };
  }
}

export async function toggleReach(from: string, to: string, allowed: boolean): Promise<void> {
  try {
    await fetch("/api/people/reach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, allowed }),
    });
  } catch {
    /* best-effort */
  }
}
