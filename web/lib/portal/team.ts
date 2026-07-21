"use client";

import type { ApiTeamMember } from "@/app/api/team/route";
import { reportFetchError } from "./fetch-error";

export type { ApiTeamMember };

export async function fetchTeam(): Promise<ApiTeamMember[]> {
  try {
    const res = await fetch("/api/team");
    if (!res.ok) {
      reportFetchError("team", new Error(`HTTP ${res.status}`));
      return [];
    }
    const data = (await res.json()) as { team?: ApiTeamMember[] };
    return data.team || [];
  } catch (err) {
    reportFetchError("team", err);
    return [];
  }
}
