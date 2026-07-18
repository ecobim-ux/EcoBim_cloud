import type { ProductivityData } from "@/lib/portal/productivity";
import { PBar } from "./PBar";
import { StatCard } from "./StatCard";

export function ProductivityView({ data }: { data: ProductivityData }) {
  const { weekly, target, productivity, remainingToday, delayed, completed, days } = data;
  const maxDay = Math.max(...days.map((d) => d[1]), 8);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 20 }}>
        <StatCard label="Weekly hours worked" value={weekly + "h"} sub={"of " + target + "h target"} color="var(--ink)" />
        <StatCard
          label="Remaining tasks today"
          value={String(remainingToday)}
          sub="still open"
          color={remainingToday > 0 ? "var(--amber)" : "var(--green)"}
        />
        <StatCard label="Delayed tasks" value={String(delayed)} sub="need attention" color={delayed > 0 ? "var(--red)" : "var(--green)"} />
      </div>
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E2DA", padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Productivity summary</div>
          <div style={{ fontSize: 13, color: "#5C594F" }}>
            {productivity}% of weekly target · {completed} tasks completed
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <PBar pct={productivity} status={productivity >= 80 ? "Completed" : "In Progress"} label="Weekly productivity" />
          <span style={{ fontSize: 12, color: "#8A867C", whiteSpace: "nowrap" }}>
            {weekly}h / {target}h
          </span>
        </div>
        <div style={{ fontSize: 11, color: "#8A867C", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
          Hours by day
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 120 }}>
          {days.map(([d, h]) => (
            <div key={d} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#171717" }}>{h}h</span>
              <div style={{ width: "100%", maxWidth: 46, height: `${Math.max(4, (h / maxDay) * 88)}px`, background: h > 0 ? "#171717" : "#E5E2DA", borderRadius: 8 }} />
              <span style={{ fontSize: 11, color: "#8A867C" }}>{d}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
