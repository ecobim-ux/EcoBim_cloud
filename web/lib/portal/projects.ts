"use client";

import type { ApiMyProject } from "@/app/api/projects/mine/route";
import type { ApiProject } from "@/app/api/projects/route";

export type { ApiMyProject, ApiProject };

export async function fetchMyProject(): Promise<ApiMyProject | null> {
  try {
    const res = await fetch("/api/projects/mine");
    if (!res.ok) return null;
    const data = (await res.json()) as { project: ApiMyProject | null };
    return data.project;
  } catch {
    return null;
  }
}

export async function fetchProjects(): Promise<ApiProject[]> {
  try {
    const res = await fetch("/api/projects");
    if (!res.ok) return [];
    const data = (await res.json()) as { projects?: ApiProject[] };
    return data.projects || [];
  } catch {
    return [];
  }
}
