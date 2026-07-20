"use client";

import type { ApiMilestone } from "@/app/api/milestones/route";

export type { ApiMilestone };

export async function fetchMilestones(): Promise<ApiMilestone[]> {
  try {
    const res = await fetch("/api/milestones");
    if (!res.ok) return [];
    const data = (await res.json()) as { milestones?: ApiMilestone[] };
    return data.milestones || [];
  } catch {
    return [];
  }
}
