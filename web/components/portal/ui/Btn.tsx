"use client";

import type { CSSProperties, ReactNode } from "react";

type BtnVariant = "p" | "s" | "d" | "g" | "pi" | "ok";

interface BtnProps {
  v?: BtnVariant;
  onClick?: () => void;
  children?: ReactNode;
  full?: boolean;
  style?: CSSProperties;
  /** Accepted for parity with the original app, which passes a prop named
      `xs` at ~85% of call sites — but this component only ever reads `style`,
      so those per-call overrides have always been silently dropped. Kept
      as-is (not wired up) to match existing production behavior exactly. */
  xs?: CSSProperties;
}

export function Btn({ v = "p", onClick, children, full, style: xs = {} }: BtnProps) {
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 500,
    border: "none",
    transition: "background .15s,opacity .15s",
    whiteSpace: "nowrap",
    width: full ? "100%" : undefined,
    justifyContent: full ? "center" : undefined,
    cursor: "pointer",
  };
  const vs: Record<BtnVariant, CSSProperties> = {
    p: { background: "var(--ink)", color: "var(--surface)", padding: "9px 20px" },
    s: { background: "var(--surface)", color: "var(--ink)", border: "1.5px solid var(--ink)", padding: "8px 18px" },
    d: { background: "var(--red-bg)", color: "var(--red)", border: "1.5px solid #FFCDD2", padding: "8px 18px" },
    g: { background: "transparent", color: "var(--ink-2)", padding: "6px 10px" },
    pi: { background: "var(--surface)", color: "var(--ink)", border: "1.5px solid var(--ink)", borderRadius: 12, padding: "6px 14px" },
    ok: { background: "var(--green)", color: "var(--surface)", padding: "9px 20px" },
  };
  return (
    <button
      style={{ ...base, ...vs[v], ...xs }}
      className={`btn-${v}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
