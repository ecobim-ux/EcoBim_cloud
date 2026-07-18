"use client";

import type { ReactNode } from "react";

interface ToggleProps {
  on: boolean;
  set: (v: boolean) => void;
  label: ReactNode;
  sub?: ReactNode;
}

export function Toggle({ on, set, label, sub }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => set(!on)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 9,
        padding: "9px 13px",
        borderRadius: 10,
        border: "1px solid " + (on ? "#171717" : "#E5E2DA"),
        background: on ? "#171717" : "#fff",
        color: on ? "#fff" : "#5C594F",
        fontSize: 12.5,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all .15s",
      }}
    >
      <span
        style={{
          width: 15,
          height: 15,
          borderRadius: 5,
          border: "1.5px solid " + (on ? "#fff" : "#C9C5BC"),
          background: on ? "#fff" : "transparent",
          color: "#171717",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        {on ? "✓" : ""}
      </span>
      <span>
        {label}
        {sub && (
          <span style={{ display: "block", fontSize: 10.5, fontWeight: 400, opacity: 0.7, marginTop: 1 }}>
            {sub}
          </span>
        )}
      </span>
    </button>
  );
}
