import { Btn } from "../ui/Btn";

const REPORTS = [
  { title: "Progress Report", desc: "Full project progress summary across all disciplines and phases.", icon: "📊" },
  { title: "Delay Analysis", desc: "Root cause breakdown of delayed tasks and critical path impact.", icon: "⚠" },
  { title: "Time Utilisation", desc: "Hours logged vs estimated per team member and task category.", icon: "⏱" },
  { title: "RFI Summary", desc: "All open, responded and closed RFIs with resolution timelines.", icon: "⊕" },
];

export function ReportsTab() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {REPORTS.map((r) => (
        <div key={r.title} style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E2DA", padding: "20px 24px", boxShadow: "none" }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>{r.icon}</div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{r.title}</h3>
          <p style={{ fontSize: 13, color: "#5C594F", lineHeight: 1.55, marginBottom: 16 }}>{r.desc}</p>
          <Btn v="s" xs={{ fontSize: 12 }}>
            Generate Report
          </Btn>
        </div>
      ))}
    </div>
  );
}
