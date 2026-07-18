"use client";

import { useCallback, useEffect, useState, Fragment } from "react";

export type ToastType = "info" | "success" | "error" | "warn";

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
}

const TOAST_COLORS: Record<ToastType, string> = {
  info: "#1D6FA8",
  success: "#1A7A4A",
  error: "#C0392B",
  warn: "#B8860B",
};

function Toast({ message, type = "info", onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3800);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 28,
        right: 24,
        zIndex: 9999,
        background: "#171717",
        color: "#FAF9F6",
        padding: "12px 20px 12px 16px",
        borderRadius: 12,
        fontSize: 13.5,
        maxWidth: 340,
        borderLeft: `4px solid ${TOAST_COLORS[type] || TOAST_COLORS.info}`,
        boxShadow: "0 4px 24px rgba(0,0,0,.22)",
        animation: "toast-in .28s cubic-bezier(0.16,1,0.3,1)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        aria-label="Close notification"
        style={{
          background: "none",
          border: "none",
          color: "#FAF9F6",
          opacity: 0.6,
          cursor: "pointer",
          fontSize: 16,
          lineHeight: 1,
          padding: "0 0 0 8px",
        }}
      >
        ×
      </button>
    </div>
  );
}

let __toastId = 0;
interface ToastEntry {
  id: number;
  message: string;
  type: ToastType;
}

/* Global toast trigger — set by useToast so any component can fire a toast
   (notify('Saved','success')) without threading a prop through every dashboard. */
export let notify: (message: string, type?: ToastType) => void = () => {};

export function useToast() {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const show = useCallback((message: string, type: ToastType = "info") => {
    const id = ++__toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);
  notify = show;
  const dismiss = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);
  const ToastHost = () => (
    <Fragment>
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => dismiss(t.id)} />
      ))}
    </Fragment>
  );
  return { show, ToastHost };
}
