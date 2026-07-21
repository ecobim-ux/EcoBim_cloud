"use client";

import type { ApiMilestone } from "@/app/api/milestones/route";
import { reportFetchError } from "./fetch-error";

export type { ApiMilestone };

export async function fetchMilestones(): Promise<ApiMilestone[]> {
  try {
    const res = await fetch("/api/milestones");
    if (!res.ok) {
      reportFetchError("milestones", new Error(`HTTP ${res.status}`));
      return [];
    }
    const data = (await res.json()) as { milestones?: ApiMilestone[] };
    return data.milestones || [];
  } catch (err) {
    reportFetchError("milestones", err);
    return [];
  }
}
