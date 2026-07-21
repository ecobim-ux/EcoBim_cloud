"use client";

import { useEffect, useRef } from "react";

const IDLE_MS = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;

/** Signs the user out after a stretch of inactivity — sessions were
    otherwise a flat 7-day cookie with no idle expiry at all, so a device
    left unlocked stayed signed in indefinitely. Only runs while `active`
    (i.e. a session exists) so it's a no-op on the login screen. */
export function useIdleLogout(active: boolean, onIdle: () => void): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  useEffect(() => {
    if (!active) return;

    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => onIdleRef.current(), IDLE_MS);
    };

    reset();
    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, reset));
    };
  }, [active]);
}
