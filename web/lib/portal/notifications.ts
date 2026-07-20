"use client";

import type { ApiNotification } from "@/app/api/notifications/route";

export type { ApiNotification };

export async function fetchNotifications(): Promise<ApiNotification[]> {
  try {
    const res = await fetch("/api/notifications");
    if (!res.ok) return [];
    const data = (await res.json()) as { notifications?: ApiNotification[] };
    return data.notifications || [];
  } catch {
    return [];
  }
}

export async function markNotificationRead(id?: string): Promise<void> {
  try {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { id } : {}),
    });
  } catch {
    /* best-effort */
  }
}

/** Replaces the old localStorage addNotif({role,...}) — recipients are now
    named explicitly by login ID instead of broadcast to an entire role,
    which is what caused every employee to see every other employee's
    notifications. */
export async function sendNotification(params: { recipientLoginIds: (string | undefined | null)[]; title: string; body: string; tab?: string }): Promise<void> {
  const recipientLoginIds = params.recipientLoginIds.filter((s): s is string => !!s);
  if (recipientLoginIds.length === 0) return;
  try {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientLoginIds, title: params.title, body: params.body, tab: params.tab }),
    });
  } catch {
    /* best-effort, matches previous addNotif's silent-catch behavior */
  }
}

export function unreadCountsByTab(notifs: ApiNotification[]): Record<string, number> {
  const c: Record<string, number> = {};
  notifs
    .filter((n) => !n.read)
    .forEach((n) => {
      if (n.tab) c[n.tab] = (c[n.tab] || 0) + 1;
    });
  return c;
}

export const unreadTotal = (notifs: ApiNotification[]) => notifs.filter((n) => !n.read).length;
