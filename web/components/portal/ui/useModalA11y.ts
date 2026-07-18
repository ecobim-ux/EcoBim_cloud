"use client";

import { useEffect, useRef } from "react";

/* Modal a11y — Escape-to-close, initial focus, and Tab focus-trap.
   Attach the returned ref (+ tabIndex={-1}) to the dialog card; pass the modal's onClose. */
export function useModalA11y(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    const SEL =
      'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Tab" && el) {
        const f = Array.from(el.querySelectorAll<HTMLElement>(SEL)).filter((n) => n.offsetParent !== null);
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    if (el) {
      const f = el.querySelector<HTMLElement>(SEL);
      try {
        (f || el).focus();
      } catch {
        /* noop */
      }
    }
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return ref;
}
