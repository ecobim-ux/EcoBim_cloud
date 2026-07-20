"use client";

import { useEffect, useRef } from "react";
import type { ApiNotification } from "@/lib/portal/notifications";

function _notifIconBg(title = "") {
  const t = title.toLowerCase();
  if (t.includes("meet")) return { bg: "#EEF6FF", color: "#2563EB" };
  if (t.includes("task")) return { bg: "#F0FDF4", color: "#15803D" };
  if (t.includes("issue") || t.includes("clash")) return { bg: "#FFF7ED", color: "#C2410C" };
  if (t.includes("rfi")) return { bg: "#FAF5FF", color: "#7C3AED" };
  if (t.includes("request") || t.includes("approval")) return { bg: "#FFF1F2", color: "#BE123C" };
  return { bg: "#F6F4EF", color: "#5C594F" };
}

function _notifEmoji(title = "") {
  const t = title.toLowerCase();
  if (t.includes("meet")) return "📅";
  if (t.includes("task")) return "🛠";
  if (t.includes("issue") || t.includes("clash")) return "⚠";
  if (t.includes("rfi")) return "⊕";
  if (t.includes("request")) return "📩";
  if (t.includes("approval")) return "✅";
  return "🔔";
}

interface NotifPopupProps {
  notifs: ApiNotification[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
  onClose: () => void;
  onNav: (tab: string) => void;
}

export function NotifPopup({ notifs, onDismiss, onDismissAll, onClose, onNav }: NotifPopupProps) {
  const ago = (ts: number) => {
    const d = Date.now() - ts;
    if (d < 60000) return "just now";
    if (d < 3600000) return Math.round(d / 60000) + "m ago";
    if (d < 86400000) return Math.round(d / 3600000) + "h ago";
    return Math.round(d / 86400000) + "d ago";
  };

  const dismiss = (id: string) => onDismiss(id);

  const accept = (n: ApiNotification) => {
    dismiss(n.id);
    if (n.tab) onNav(n.tab);
    onClose();
  };

  const dismissAll = () => {
    onDismissAll();
    onClose();
  };

  /* close on outside click */
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (notifs.length === 0) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 300, pointerEvents: "none" }}>
        <div
          ref={ref}
          style={{
            position: "absolute",
            top: 76,
            right: 24,
            width: 370,
            background: "#fff",
            borderRadius: 14,
            border: "1px solid #E5E2DA",
            boxShadow: "0 8px 40px rgba(0,0,0,.13)",
            pointerEvents: "all",
            animation: "sIn .22s ease both",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "13px 16px",
              borderBottom: "1px solid #F2F0EA",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#F6F4EF",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Notifications</div>
            </div>
            <button onClick={onClose} style={{ fontSize: 18, color: "#8A867C", background: "none", border: "none", cursor: "pointer", padding: "0 4px", lineHeight: 1 }}>
              ×
            </button>
          </div>
          <div style={{ padding: "32px 16px", textAlign: "center", color: "#8A867C", fontSize: 13 }}>All caught up!</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, pointerEvents: "none" }}>
      <style>{`
        @keyframes sIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
        .nc-card{transition:background .15s;}
        .nc-card:hover{background:#FAFAF8!important;}
        .nc-x:hover{background:#FEF2F2!important;color:#DC2626!important;}
        .nc-ok:hover{background:#F0FDF4!important;color:#16A34A!important;}
      `}</style>
      <div
        ref={ref}
        style={{
          position: "absolute",
          top: 76,
          right: 24,
          width: 370,
          background: "#fff",
          borderRadius: 14,
          border: "1px solid #E5E2DA",
          boxShadow: "0 8px 40px rgba(0,0,0,.13)",
          pointerEvents: "all",
          animation: "sIn .22s ease both",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "13px 16px",
            borderBottom: "1px solid #F2F0EA",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#F6F4EF",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Notifications</div>
              <div style={{ fontSize: 11, color: "#8A867C" }}>{notifs.length} unread</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              onClick={dismissAll}
              style={{ fontSize: 11, color: "#5C594F", background: "none", border: "1px solid #E5E2DA", borderRadius: 6, cursor: "pointer", fontWeight: 500, padding: "4px 9px", fontFamily: "inherit" }}
            >
              Mark all read
            </button>
            <button onClick={onClose} style={{ fontSize: 18, color: "#8A867C", background: "none", border: "none", cursor: "pointer", padding: "0 4px", lineHeight: 1 }}>
              ×
            </button>
          </div>
        </div>
        <div style={{ maxHeight: 420, overflowY: "auto", padding: "8px", display: "flex", flexDirection: "column", gap: 6 }}>
          {notifs.map((n) => {
            const ic = _notifIconBg(n.title);
            const emoji = _notifEmoji(n.title);
            const isActionable = !!n.tab;
            return (
              <div
                key={n.id}
                className="nc-card"
                style={{ background: "#FDFCFB", border: "1px solid #EDEAE3", borderRadius: 12, padding: "12px 12px 10px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: ic.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, border: `1px solid ${ic.bg}` }}>
                      {emoji}
                    </div>
                    <div style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: "#22C55E", border: "2px solid #fff" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#171717", marginBottom: 2 }}>{n.title}</div>
                        <div style={{ fontSize: 12.5, color: "#5C594F", lineHeight: 1.5 }}>{n.body}</div>
                      </div>
                      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                        <button
                          className="nc-x"
                          onClick={(e) => {
                            e.stopPropagation();
                            dismiss(n.id);
                          }}
                          title="Dismiss"
                          style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #E5E2DA", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", transition: "all .15s" }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                        {isActionable && (
                          <button
                            className="nc-ok"
                            onClick={(e) => {
                              e.stopPropagation();
                              accept(n);
                            }}
                            title="View"
                            style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #E5E2DA", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", transition: "all .15s" }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 8, paddingLeft: 50, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>{ago(n.ts)}</span>
                  {isActionable && (
                    <span style={{ fontSize: 11, color: "#171717", fontWeight: 600, opacity: 0.6 }}>→ {n.tab}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
