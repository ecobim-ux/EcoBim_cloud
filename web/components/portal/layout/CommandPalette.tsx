"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { _CMD_ITEMS, type CmdItem } from "@/lib/portal/command-items";

interface CommandPaletteProps {
  role: string;
  open: boolean;
  onClose: () => void;
  onNav: (tab: string) => void;
  onAction: (action: string) => void;
}

export function CommandPalette({ role, open, onClose, onNav, onAction }: CommandPaletteProps) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(() => {
    const groups = _CMD_ITEMS[role] || [];
    const s = q.toLowerCase().trim();
    if (!s) return groups;
    return groups
      .map((g) => ({ ...g, items: g.items.filter((it) => it.label.toLowerCase().includes(s)) }))
      .filter((g) => g.items.length > 0);
  }, [q, role]);

  useEffect(() => {
    if (open) {
      setQ("");
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) onClose();
      }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;

  const select = (item: CmdItem) => {
    onClose();
    if (item.tab) onNav(item.tab);
    else if (item.action) onAction(item.action);
  };
  const totalItems = filtered.reduce((n, g) => n + g.items.length, 0);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 800, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "18vh" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        @keyframes cmdIn{from{opacity:0;transform:translateY(-12px) scale(.97)}to{opacity:1;transform:none}}
        .cmd-item-row{display:flex;align-items:center;gap:10px;padding:8px 14px;border-radius:8px;cursor:pointer;transition:background .1s;}
        .cmd-item-row:hover,.cmd-item-row.cmd-sel{background:#F2F0EA;}
      `}</style>
      <div style={{ background: "rgba(23,23,23,.32)", position: "fixed", inset: 0, backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div
        style={{
          position: "relative",
          width: 520,
          maxWidth: "92vw",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 24px 64px rgba(0,0,0,.22)",
          border: "1px solid #E5E2DA",
          overflow: "hidden",
          animation: "cmdIn .2s ease both",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 16px", borderBottom: "1px solid #E5E2DA" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A867C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search navigation, actions…"
            style={{ flex: 1, border: "none", outline: "none", fontSize: 14, padding: "14px 0", background: "transparent", color: "#171717", fontFamily: "var(--font-instrument-sans),sans-serif" }}
          />
          <kbd onClick={onClose} style={{ fontSize: 11, color: "#8A867C", background: "#F2F0EA", border: "1px solid #E5E2DA", borderRadius: 5, padding: "2px 6px", cursor: "pointer", fontFamily: "inherit" }}>
            ESC
          </kbd>
        </div>
        <div style={{ maxHeight: 360, overflowY: "auto", padding: "6px 0" }}>
          {totalItems === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", fontSize: 13, color: "#8A867C" }}>No results for &quot;{q}&quot;</div>
          ) : (
            filtered.map((g, gi) => (
              <div key={gi}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#8A867C", padding: "10px 16px 4px" }}>
                  {g.group}
                </div>
                {g.items.map((item, ii) => (
                  <div key={ii} className="cmd-item-row" onClick={() => select(item)}>
                    <span style={{ fontSize: 15, width: 22, textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#171717" }}>{item.label}</span>
                    {item.tab && <span style={{ marginLeft: "auto", fontSize: 11, color: "#8A867C" }}>→ tab</span>}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
        <div style={{ borderTop: "1px solid #F2F0EA", padding: "8px 16px", display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#8A867C" }}>
            <kbd style={{ background: "#F2F0EA", border: "1px solid #E5E2DA", borderRadius: 4, padding: "1px 5px", fontSize: 10, fontFamily: "inherit" }}>↑↓</kbd> navigate
          </span>
          <span style={{ fontSize: 11, color: "#8A867C" }}>
            <kbd style={{ background: "#F2F0EA", border: "1px solid #E5E2DA", borderRadius: 4, padding: "1px 5px", fontSize: 10, fontFamily: "inherit" }}>↵</kbd> select
          </span>
          <span style={{ fontSize: 11, color: "#8A867C", marginLeft: "auto" }}>
            <kbd style={{ background: "#F2F0EA", border: "1px solid #E5E2DA", borderRadius: 4, padding: "1px 5px", fontSize: 10, fontFamily: "inherit" }}>⌘K</kbd> toggle
          </span>
        </div>
      </div>
    </div>
  );
}
