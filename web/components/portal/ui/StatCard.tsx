import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  color?: string;
}

export function StatCard({ label, value, sub, color = "var(--ink)" }: StatCardProps) {
  return (
    <div
      className="card-h"
      style={{
        background: "var(--surface)",
        borderRadius: 12,
        padding: "18px 20px",
        border: "1px solid var(--line)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "var(--ink-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        className="num"
        style={{
          fontSize: 30,
          fontWeight: 600,
          color,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 12,
            color: "var(--ink-muted)",
            marginTop: 6,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}
