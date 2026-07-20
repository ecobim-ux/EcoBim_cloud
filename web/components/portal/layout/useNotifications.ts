"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchNotifications, markNotificationRead, unreadCountsByTab, unreadTotal, type ApiNotification } from "@/lib/portal/notifications";

export function useNotifications() {
  const [notifs, setNotifs] = useState<ApiNotification[]>([]);

  const refetch = useCallback(() => {
    fetchNotifications().then(setNotifs);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const dismiss = useCallback(
    async (id: string) => {
      setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      await markNotificationRead(id);
      refetch();
    },
    [refetch],
  );

  const dismissAll = useCallback(async () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    await markNotificationRead();
    refetch();
  }, [refetch]);

  return {
    notifs,
    unread: notifs.filter((n) => !n.read),
    counts: unreadCountsByTab(notifs),
    total: unreadTotal(notifs),
    dismiss,
    dismissAll,
    refetch,
  };
}
