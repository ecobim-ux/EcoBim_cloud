"use client";

import type { ApiTeamMember } from "@/app/api/team/route";

export type { ApiTeamMember };

export async function fetchTeam(): Promise<ApiTeamMember[]> {
  try {
    const res = await fetch("/api/team");
    if (!res.ok) return [];
    const data = (await res.json()) as { team?: ApiTeamMember[] };
    return data.team || [];
  } catch {
    return [];
  }
}
