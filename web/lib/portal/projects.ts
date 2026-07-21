"use client";

import type { ApiMyProject } from "@/app/api/projects/mine/route";
import type { ApiProject } from "@/app/api/projects/route";
import { reportFetchError } from "./fetch-error";

export type { ApiMyProject, ApiProject };

export async function fetchMyProject(): Promise<ApiMyProject | null> {
  try {
    const res = await fetch("/api/projects/mine");
    if (!res.ok) {
      reportFetchError("your project", new Error(`HTTP ${res.status}`));
      return null;
    }
    const data = (await res.json()) as { project: ApiMyProject | null };
    return data.project;
  } catch (err) {
    reportFetchError("your project", err);
    return null;
  }
}

export async function fetchProjects(): Promise<ApiProject[]> {
  try {
    const res = await fetch("/api/projects");
    if (!res.ok) {
      reportFetchError("projects", new Error(`HTTP ${res.status}`));
      return [];
    }
    const data = (await res.json()) as { projects?: ApiProject[] };
    return data.projects || [];
  } catch (err) {
    reportFetchError("projects", err);
    return [];
  }
}
