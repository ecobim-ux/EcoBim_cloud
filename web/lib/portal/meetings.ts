"use client";

import type { ApiMeeting } from "@/app/api/meetings/route";

export type { ApiMeeting };

export async function fetchMeetings(): Promise<ApiMeeting[]> {
  try {
    const res = await fetch("/api/meetings");
    if (!res.ok) return [];
    const data = (await res.json()) as { meetings?: ApiMeeting[] };
    return data.meetings || [];
  } catch {
    return [];
  }
}

export async function scheduleMeeting(params: {
  title: string;
  date: string;
  time: string;
  duration: string;
  joinUrl: string;
  note?: string;
  attendeeLoginIds: (string | undefined | null)[];
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...params, attendeeLoginIds: params.attendeeLoginIds.filter((s): s is string => !!s) }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) return { ok: false, error: data.error || "Couldn't schedule that meeting." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't reach the server. Please try again." };
  }
}
