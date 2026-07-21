import { useEffect, useState } from "react";
import type { ApiProject } from "@/lib/portal/projects";
import { fetchTeam, type ApiTeamMember } from "@/lib/portal/team";
import { fetchIssues, type ApiIssue } from "@/lib/portal/issues";
import { Avi } from "../ui/Avi";
import { Badge, SevColor } from "../ui/Badge";
import { PBar } from "../ui/PBar";
import { LOD, PhasePill } from "../ui/icons";

export function ProjectDetailModal({ p, onClose }: { p: ApiProject; onClose: () => void }) {
  const [team, setTeam] = useState<ApiTeamMember[]>([]);
  const [issues, setIssues] = useState<ApiIssue[]>([]);
  useEffect(() => {
    fetchTeam().then(setTeam);
    fetchIssues().then(setIssues);
  }, []);
  const teamOnProject = team.filter((m) => m.project === p.name);
  const openIssuesOnProject = issues.filter((i) => i.project === p.name && !i.resolved);
  const phaseList = p.phases.map((ph) => ({ n: ph.label, pct: ph.percentComplete }));

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(26,26,46,.45)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 720, maxHeight: "88vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,.22)" }}>
        <div style={{ background: "#0c1628", padding: "24px 28px", position: "relative" }}>
          <button
            onClick={onClose}
            style={{ position: "absolute", top: 14, right: 16, background: "rgba(255,255,255,.12)", border: "none", color: "#fff", borderRadius: 12, width: 32, height: 32, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ×
          </button>
          <div style={{ fontSize: 11, color: "rgba(244,242,236,.5)", fontFamily: "var(--font-instrument-sans),sans-serif", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
            {p.type || "—"}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{p.name}</h2>
          <div style={{ fontSize: 13, color: "rgba(244,242,236,.65)", marginBottom: 14 }}>{p.client || "No client assigned"}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {p.phaseCode && <PhasePill p={p.phaseCode} />}
            {p.lod && <LOD v={p.lod} />}
            {p.issueCount > 0 && (
              <span style={{ background: "rgba(192,57,43,.2)", color: "#ff8a7a", padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                ⚠ {p.issueCount} issues
              </span>
            )}
          </div>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "#FAF9F6", borderRadius: 12, border: "1px solid #E5E2DA", padding: "16px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#8A867C", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                Overall Progress
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
                <span style={{ fontFamily: "var(--font-instrument-sans),sans-serif", fontSize: 36, fontWeight: 700, color: "#171717", lineHeight: 1 }}>{p.progress}%</span>
                <span style={{ fontSize: 12, color: "#8A867C" }}>{p.phaseCode ? p.phaseCode + " phase" : "No phase set"}</span>
              </div>
              <PBar pct={p.progress} label={p.name + " overall progress"} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 11, color: "#8A867C", fontFamily: "var(--font-instrument-sans),sans-serif" }}>
                <span>{p.start || "—"}</span>
                <span>{p.end || "—"}</span>
              </div>
              <div style={{ position: "relative", height: 6, background: "#E5E2DA", borderRadius: 12, marginTop: 6 }}>
                <div style={{ position: "absolute", left: `${p.cpct}%`, top: -3, width: 2, height: 12, background: "#B8860B", borderRadius: 2 }} />
              </div>
            </div>
            <div style={{ background: "#FAF9F6", borderRadius: 12, border: "1px solid #E5E2DA", padding: "16px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#8A867C", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                Phase Breakdown
              </div>
              {phaseList.length === 0 ? (
                <div style={{ fontSize: 12, color: "#8A867C" }}>No phases set up yet.</div>
              ) : (
                phaseList.map((ph) => (
                  <div key={ph.n} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: ph.pct === 100 ? "#1A7A4A" : ph.pct > 0 ? "#171717" : "#8A867C" }}>{ph.n}</span>
                      <span style={{ fontFamily: "var(--font-instrument-sans),sans-serif", fontSize: 11, color: ph.pct === 100 ? "#1A7A4A" : ph.pct > 0 ? "#171717" : "#8A867C", fontWeight: 600 }}>
                        {ph.pct === 100 ? "Done" : ph.pct > 0 ? `${ph.pct}%` : "Upcoming"}
                      </span>
                    </div>
                    <PBar pct={ph.pct} status={ph.pct === 100 ? "Completed" : ph.pct > 0 ? "In Progress" : "Not Started"} label={ph.n} />
                  </div>
                ))
              )}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>👥 Team ({teamOnProject.length} members)</div>
            {teamOnProject.length === 0 ? (
              <div style={{ fontSize: 13, color: "#8A867C" }}>No team members currently assigned.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {teamOnProject.map((m) => (
                  <div key={m.partyId} style={{ display: "flex", alignItems: "center", gap: 12, background: "#FAF9F6", borderRadius: 12, border: "1px solid #E5E2DA", padding: "12px 14px" }}>
                    <Avi ini={m.initials} size={34} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                        {m.name}
                        {m.hasDelay && <span style={{ color: "#B8860B", fontSize: 12 }}>⚠</span>}
                      </div>
                      <div style={{ fontSize: 11, color: "#8A867C", marginBottom: 4 }}>{m.role || "—"}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <PBar pct={m.pct} status={m.status} label={m.name} />
                        <span style={{ fontFamily: "var(--font-instrument-sans),sans-serif", fontSize: 11, color: "#171717", fontWeight: 600, flexShrink: 0 }}>{m.pct}%</span>
                      </div>
                    </div>
                    <Badge s={m.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
          {openIssuesOnProject.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>⚠ Open Issues ({openIssuesOnProject.length})</div>
              {openIssuesOnProject.map((iss) => (
                <div key={iss.id} style={{ borderLeft: `3px solid ${SevColor[iss.sev]}`, background: "#FAF9F6", borderRadius: 12, border: "1px solid #E5E2DA", padding: "12px 14px", marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{iss.title}</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: SevColor[iss.sev] }}>{iss.sev}</span>
                      <Badge s={iss.status} />
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#5C594F", lineHeight: 1.5 }}>{iss.desc}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, paddingTop: 4, borderTop: "1px solid #E5E2DA" }}>
            {[
              { l: "Team Size", v: p.teamSize + "" },
              { l: "LOD", v: p.lod || "—" },
              { l: "Lead", v: p.lead || "—" },
              { l: "Freelance", v: p.client ? p.client.split(" ").slice(0, 2).join(" ") : "—" },
            ].map((s) => (
              <div key={s.l} style={{ textAlign: "center", padding: "10px 0" }}>
                <div style={{ fontSize: 11, color: "#8A867C", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{s.l}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#171717" }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
