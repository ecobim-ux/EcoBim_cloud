"use client";

import { useEffect, useState } from "react";
import { fetchTeam, type ApiTeamMember } from "@/lib/portal/team";
import { fetchProjects, type ApiProject } from "@/lib/portal/projects";
import { Avi } from "../ui/Avi";
import { Badge } from "../ui/Badge";
import { PBar } from "../ui/PBar";

function GanttBar({ project }: { project: ApiProject | null }) {
  if (!project) {
    return (
      <div style={{ background: "#fff", borderRadius: 12, border: "1px dashed #E5E2DA", padding: "28px", textAlign: "center", color: "#8A867C", fontSize: 13, marginBottom: 24 }}>
        No project set up yet.
      </div>
    );
  }
  const phases = project.phases;
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E2DA", padding: "20px 24px", marginBottom: 24 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Project Timeline — {project.name}</div>
      {phases.length === 0 ? (
        <div style={{ fontSize: 13, color: "#8A867C" }}>No phases set up yet.</div>
      ) : (
        <div style={{ position: "relative", height: 36, borderRadius: 12, overflow: "visible", display: "flex", gap: 2 }}>
          {phases.map((p, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: "100%",
                background: p.gateStatus === "DONE" ? "#1A7A4A" : p.gateStatus === "ACTIVE" ? "#171717" : "#E5E2DA",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                transition: "opacity .15s",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 600, color: p.gateStatus === "DONE" || p.gateStatus === "ACTIVE" ? "#fff" : "#8A867C", whiteSpace: "nowrap" }}>
                {p.code}
              </span>
            </div>
          ))}
          <div style={{ position: "absolute", left: `${project.cpct}%`, top: -6, bottom: -6, width: 2, background: "#B8860B", borderRadius: 2, zIndex: 5 }}>
            <div style={{ position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)", background: "#B8860B", color: "#fff", fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 12, whiteSpace: "nowrap" }}>
              Today
            </div>
          </div>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "#8A867C", fontFamily: "var(--font-instrument-sans),sans-serif" }}>
        <span>{project.start || "—"}</span>
        <span>{project.end || "—"}</span>
      </div>
    </div>
  );
}

export function TeamOverviewTab() {
  const [team, setTeam] = useState<ApiTeamMember[]>([]);
  const [projects, setProjects] = useState<ApiProject[]>([]);

  useEffect(() => {
    fetchTeam().then(setTeam);
    fetchProjects().then(setProjects);
  }, []);

  return (
    <div>
      <GanttBar project={projects[0] ?? null} />
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Team Progress</div>
      <div className="proj-grid">
        {team.map((m) => (
          <div key={m.partyId} className="card-h" style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E2DA", padding: "16px 20px", boxShadow: "none", transition: "box-shadow .18s,transform .18s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Avi ini={m.initials} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {m.name} {m.hasDelay && <span style={{ color: "#B8860B" }}>⚠</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "#8A867C" }}>{m.role || "—"}</div>
                </div>
              </div>
              <Badge s={m.status} />
            </div>
            <div style={{ fontSize: 12, color: "#5C594F", marginBottom: 10 }}>{m.task || "No active task"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <PBar pct={m.pct} status={m.status} label={m.name} />
              <span style={{ fontFamily: "var(--font-instrument-sans),sans-serif", fontSize: 12, color: "#171717", fontWeight: 600, flexShrink: 0 }}>{m.pct}%</span>
            </div>
            <div style={{ fontSize: 11, color: "#8A867C", fontFamily: "var(--font-instrument-sans),sans-serif" }}>
              {m.hoursLogged}h logged / {m.hoursTarget}h est.
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
