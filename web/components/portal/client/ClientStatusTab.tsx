"use client";

import { useEffect, useState } from "react";
import type { ApiMyProject } from "@/lib/portal/projects";
import { fetchMilestones, type ApiMilestone } from "@/lib/portal/milestones";
import { Avi } from "../ui/Avi";
import { PBar } from "../ui/PBar";
import { ScheduleMeetingButton } from "../shared/ScheduleMeetingButton";
import { DonutChart } from "./DonutChart";

export function ClientStatusTab({ project, userName }: { project: ApiMyProject | null; userName: string }) {
  const [milestones, setMilestones] = useState<ApiMilestone[]>([]);

  useEffect(() => {
    fetchMilestones().then(setMilestones);
  }, []);

  const activeMilestone = milestones.find((m) => m.active);
  const nextMilestone = milestones.find((m) => !m.done && !m.active);
  const openIssues = project?.openIssues ?? 0;
  const progress = project?.overallProgress ?? 0;

  if (!project) {
    return (
      <div style={{ background: "#fff", borderRadius: 12, border: "1px dashed #E5E2DA", padding: "40px", textAlign: "center", color: "#8A867C", fontSize: 14 }}>
        Your project hasn&apos;t been set up yet — your EcoBIM team will share status here once work begins.
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 13, color: "#8A867C", fontWeight: 500, marginBottom: 8 }}>Overall Project Progress</div>
          <DonutChart pct={progress} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
        <div style={{ background: openIssues === 0 ? "#EAFAF1" : "#FDECEA", border: "1px solid " + (openIssues === 0 ? "#1A7A4A" : "#C0392B"), borderRadius: 12, padding: "20px", textAlign: "center" }}>
          <div style={{ fontSize: 28 }}>{openIssues === 0 ? "✓" : "⚠"}</div>
          <div style={{ fontWeight: 600, marginTop: 8, color: openIssues === 0 ? "#1A7A4A" : "#C0392B" }}>{openIssues === 0 ? "On Track" : "Needs Attention"}</div>
          <div style={{ fontSize: 13, color: "#5C594F", marginTop: 4 }}>{openIssues === 0 ? "No open coordination issues" : openIssues + " open issue" + (openIssues === 1 ? "" : "s") + " being tracked"}</div>
        </div>
        <div style={{ background: "#F2F0EA", border: "1px solid #171717", borderRadius: 12, padding: "20px", textAlign: "center" }}>
          <div style={{ fontSize: 28 }}>◈</div>
          <div style={{ fontWeight: 600, marginTop: 8, color: "#171717" }}>In Progress</div>
          <div style={{ fontSize: 13, color: "#5C594F", marginTop: 4 }}>{activeMilestone ? activeMilestone.label : "No milestone active"}</div>
        </div>
        <div style={{ background: "#F2F0EA", border: "1px solid #171717", borderRadius: 12, padding: "20px", textAlign: "center" }}>
          <div style={{ fontSize: 28 }}>🎯</div>
          <div style={{ fontWeight: 600, marginTop: 8, color: "#171717" }}>Upcoming</div>
          <div style={{ fontSize: 13, color: "#5C594F", marginTop: 4 }}>{nextMilestone ? nextMilestone.label + " — " + nextMilestone.date : "Nothing scheduled yet"}</div>
        </div>
      </div>
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E2DA", padding: "20px 24px", marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Phase Progress</div>
        {project.phases.length === 0 ? (
          <div style={{ fontSize: 13, color: "#8A867C" }}>Phase breakdown hasn&apos;t been set up yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {project.phases.map((ph) => (
              <div key={ph.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 13, color: ph.percentComplete === 100 ? "#1A7A4A" : ph.percentComplete > 0 ? "#171717" : "#8A867C" }}>{ph.label}</span>
                  <span style={{ fontFamily: "var(--font-instrument-sans),sans-serif", fontSize: 12, color: ph.percentComplete === 100 ? "#1A7A4A" : ph.percentComplete > 0 ? "#171717" : "#8A867C", fontWeight: 600 }}>
                    {ph.percentComplete === 100 ? "Complete" : ph.percentComplete > 0 ? `${ph.percentComplete}%` : "Not started"}
                  </span>
                </div>
                <PBar pct={ph.percentComplete} status={ph.percentComplete === 100 ? "Completed" : ph.percentComplete > 0 ? "In Progress" : "Not Started"} label={ph.label} />
              </div>
            ))}
          </div>
        )}
      </div>
      {project.contact && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E2DA", padding: "20px 24px" }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Your Project Contact</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "space-between", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Avi ini={project.contact.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()} size={48} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{project.contact.name}</div>
                <div style={{ fontSize: 13, color: "#8A867C" }}>{project.contact.role || "Team Lead"}</div>
                {project.contact.email && <div style={{ fontSize: 13, color: "#171717", marginTop: 4 }}>{project.contact.email}</div>}
              </div>
            </div>
            <ScheduleMeetingButton role="client" userName={userName} compact={true} />
          </div>
        </div>
      )}
    </div>
  );
}
