"use client";

import type { ApiIssue } from "@/app/api/issues/route";
import { reportFetchError } from "./fetch-error";

export type { ApiIssue };

export async function fetchIssues(): Promise<ApiIssue[]> {
  try {
    const res = await fetch("/api/issues");
    if (!res.ok) {
      reportFetchError("issues", new Error(`HTTP ${res.status}`));
      return [];
    }
    const data = (await res.json()) as { issues?: ApiIssue[] };
    return data.issues || [];
  } catch (err) {
    reportFetchError("issues", err);
    return [];
  }
}

export async function raiseIssue(params: { title: string; description: string; severity: string; recipientLoginId: string }): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) return { ok: false, error: data.error || "Couldn't raise that issue." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't reach the server. Please try again." };
  }
}

export async function resolveIssue(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/issues/${id}/resolve`, { method: "POST" });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) return { ok: false, error: data.error || "Couldn't resolve that issue." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't reach the server. Please try again." };
  }
}

export async function escalateIssue(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/issues/${id}/escalate`, { method: "POST" });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) return { ok: false, error: data.error || "Couldn't escalate that issue." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't reach the server. Please try again." };
  }
}

export async function respondToIssue(id: string, response: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/issues/${id}/respond`, {
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
