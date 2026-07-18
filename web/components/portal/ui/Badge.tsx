import { BADGE_CFG } from "@/lib/portal/data";

export function Badge({ s }: { s: string }) {
  const c = BADGE_CFG[s] || BADGE_CFG["Not Started"];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: c[0],
        color: c[1],
        padding: "3px 10px",
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: c[2],
          flexShrink: 0,
        }}
      />
      {s}
    </span>
  );
}

export function Priority({ p }: { p: string }) {
  const col = p === "High" ? "var(--red)" : p === "Medium" ? "var(--amber)" : "var(--ink-muted)";
  return (
    <span
      style={{
        color: col,
        fontWeight: 600,
        fontSize: 12,
      }}
    >
      {p}
    </span>
  );
}

export const SevColor: Record<string, string> = {
  High: "#C0392B",
  Medium: "#B8860B",
  Low: "#8A867C",
};
