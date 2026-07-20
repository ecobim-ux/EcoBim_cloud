"use client";

import type { ApiRfi } from "@/app/api/rfis/route";

export type { ApiRfi };

export async function fetchRfis(): Promise<ApiRfi[]> {
  try {
    const res = await fetch("/api/rfis");
    if (!res.ok) return [];
    const data = (await res.json()) as { rfis?: ApiRfi[] };
    return data.rfis || [];
  } catch {
    return [];
  }
}

export async function assignRfi(id: string, assigneeLoginId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/rfis/${id}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigneeLoginId }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) return { ok: false, error: data.error || "Couldn't assign that RFI." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't reach the server. Please try again." };
  }
}

export async function respondToRfi(id: string, response: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/rfis/${id}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) return { ok: false, error: data.error || "Couldn't send that response." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't reach the server. Please try again." };
  }
}
