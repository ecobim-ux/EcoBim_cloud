"use client";

import { useState } from "react";
import { fetchTasks } from "@/lib/portal/tasks";
import { fetchRfis } from "@/lib/portal/rfis";
import { fetchProjects } from "@/lib/portal/projects";
import { fetchTeam } from "@/lib/portal/team";
import { downloadCsv } from "@/lib/portal/csv";
import { Btn } from "../ui/Btn";

const REPORTS = [
  { key: "progress", title: "Progress Report", desc: "Full project progress summary across all disciplines and phases.", icon: "📊" },
  { key: "delay", title: "Delay Analysis", desc: "Root cause breakdown of delayed tasks and critical path impact.", icon: "⚠" },
  { key: "time", title: "Time Utilisation", desc: "Hours logged vs estimated per team member and task category.", icon: "⏱" },
  { key: "rfi", title: "RFI Summary", desc: "All open, responded and closed RFIs with resolution timelines.", icon: "⊕" },
] as const;

type ReportKey = (typeof REPORTS)[number]["key"];

async function generate(key: ReportKey) {
  const stamp = new Date().toISOString().slice(0, 10);
  if (key === "progress") {
    const projects = await fetchProjects();
    downloadCsv(
      `progress-report-${stamp}.csv`,
      ["Project", "Code", "Client", "Phase", "Progress %", "Team Size", "Open Issues", "Open RFIs", "Lead", "Start", "End"],
      projects.map((p) => [p.name, p.code, p.client, p.phaseLabel, p.progress, p.teamSize, p.issueCount, p.openRfis, p.lead, p.start, p.end]),
    );
    return;
  }
  if (key === "delay") {
    const tasks = await fetchTasks();
    const delayed = tasks.filter((t) => t.status === "Delayed");
    downloadCsv(
      `delay-analysis-${stamp}.csv`,
      ["Task", "Code", "Project", "Assigned To", "Due", "Priority", "% Complete", "Delay Reason"],
      delayed.map((t) => [t.task, t.code, t.project, t.assignedTo, t.due, t.priority, t.pct, t.delay]),
    );
    return;
  }
  if (key === "time") {
    const team = await fetchTeam();
    downloadCsv(
      `time-utilisation-${stamp}.csv`,
      ["Member", "Role", "Project", "Hours Logged (week)", "Hours Target (week)", "Utilisation %", "Current Task", "Status"],
      team.map((m) => [m.name, m.role, m.project, m.hoursLogged, m.hoursTarget, Math.round((m.hoursLogged / m.hoursTarget) * 100), m.task, m.status]),
    );
    return;
  }
  const rfis = await fetchRfis();
  downloadCsv(
    `rfi-summary-${stamp}.csv`,
    ["RFI", "Code", "Status", "Priority", "Raised", "Assignee", "Response", "Responded By"],
    rfis.map((r) => [r.title, r.code, r.status, r.priority, r.raised, r.assigneeName, r.response, r.respondedBy]),
  );
}

export function ReportsTab() {
  const [busy, setBusy] = useState<ReportKey | null>(null);

  const run = async (key: ReportKey) => {
    setBusy(key);
    try {
      await generate(key);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {REPORTS.map((r) => (
        <div key={r.key} style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E2DA", padding: "20px 24px", boxShadow: "none" }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>{r.icon}</div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{r.title}</h3>
          <p style={{ fontSize: 13, color: "#5C594F", lineHeight: 1.55, marginBottom: 16 }}>{r.desc}</p>
          <Btn v="s" xs={{ fontSize: 12 }} onClick={busy ? undefined : () => run(r.key)}>
            {busy === r.key ? "Generating…" : "Generate Report"}
          </Btn>
        </div>
      ))}
    </div>
  );
}
