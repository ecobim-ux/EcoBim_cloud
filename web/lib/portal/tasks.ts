"use client";

import type { ApiTask } from "@/app/api/tasks/route";
import { reportFetchError } from "./fetch-error";

export type { ApiTask };

export async function fetchTasks(): Promise<ApiTask[]> {
  try {
    const res = await fetch("/api/tasks");
    if (!res.ok) {
      reportFetchError("tasks", new Error(`HTTP ${res.status}`));
      return [];
    }
    const data = (await res.json()) as { tasks?: ApiTask[] };
    return data.tasks || [];
  } catch (err) {
    reportFetchError("tasks", err);
    return [];
  }
}

export async function createTask(params: {
  title: string;
  description?: string;
  assigneeLoginId: string;
  projectName?: string;
  priority?: string;
  dueOn?: string;
  milestoneLabel?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) return { ok: false, error: data.error || "Couldn't create that task." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't reach the server. Please try again." };
  }
}

export async function removeTask(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/tasks/${id}/remove`, { method: "POST" });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) return { ok: false, error: data.error || "Couldn't remove that task." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't reach the server. Please try again." };
  }
}

export interface ApiTaskLogEntry {
  label: string;
  date: string;
}

export async function completeTask(id: string): Promise<{ ok: boolean; error?: string; log?: ApiTaskLogEntry }> {
  try {
    const res = await fetch(`/api/tasks/${id}/complete`, { method: "POST" });
    const data = (await res.json().catch(() => ({}))) as { error?: string; log?: ApiTaskLogEntry };
    if (!res.ok) return { ok: false, error: data.error || "Couldn't complete that task." };
    return { ok: true, log: data.log };
  } catch {
    return { ok: false, error: "Couldn't reach the server. Please try again." };
  }
}

export async function reassignTask(id: string, assigneeLoginId: string): Promise<{ ok: boolean; error?: string; log?: ApiTaskLogEntry }> {
  try {
    const res = await fetch(`/api/tasks/${id}/reassign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigneeLoginId }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; log?: ApiTaskLogEntry };
    if (!res.ok) return { ok: false, error: data.error || "Couldn't reassign that task." };
    return { ok: true, log: data.log };
  } catch {
    return { ok: false, error: "Couldn't reach the server. Please try again." };
  }
}
