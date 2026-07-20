"use client";

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
