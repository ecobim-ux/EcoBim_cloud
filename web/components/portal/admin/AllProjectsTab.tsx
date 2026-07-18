"use client";

import { useState } from "react";
import { PROJECTS, type Project } from "@/lib/portal/data";
import { Btn } from "../ui/Btn";
import { PBar } from "../ui/PBar";
import { LOD, PhasePill } from "../ui/icons";
import { ProjectDetailModal } from "./ProjectDetailModal";

export function AllProjectsTab() {
  const [sel, setSel] = useState<Project | null>(null);
  return (
    <div>
      {sel && <ProjectDetailModal p={sel} onClose={() => setSel(null)} />}
      <div className="proj-grid">
        {PROJECTS.map((p) => (
          <div
            key={p.id}
            className="card-h"
            onClick={() => setSel(p)}
            style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E2DA", padding: "20px 24px", boxShadow: "none", cursor: "pointer", transition: "box-shadow .18s,transform .18s" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>{p.name}</h3>
              {p.issueCount > 0 && (
                <span style={{ color: "#C0392B", fontSize: 12, fontWeight: 600, background: "#FDECEA", padding: "2px 8px", borderRadius: 12 }}>
                  ⚠ {p.issueCount} issues
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, color: "#8A867C", marginBottom: 12 }}>{p.client}</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <PhasePill p={p.phase} />
              <LOD v={p.lod} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "#5C594F" }}>Progress</span>
              <span style={{ fontFamily: "var(--font-instrument-sans),sans-serif", fontSize: 13, fontWeight: 600, color: "#171717" }}>{p.progress}%</span>
            </div>
            <PBar pct={p.progress} label={p.name + " progress"} />
            <div style={{ marginTop: 12, borderTop: "1px solid #F2F0EA", paddingTop: 12 }}>
              <div style={{ position: "relative", height: 6, background: "#E5E2DA", borderRadius: 12, marginBottom: 6 }}>
                <div style={{ position: "absolute", left: `${p.cpct}%`, top: -4, width: 2, height: 14, background: "#B8860B", borderRadius: 2 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8A867C", fontFamily: "var(--font-instrument-sans),sans-serif" }}>
                <span>{p.start}</span>
                <span>Lead: {p.lead}</span>
                <span>{p.end}</span>
              </div>
            </div>
            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#8A867C" }}>👤 {p.teamSize} members</span>
              <Btn v="g" xs={{ border: "1px solid #E5E2DA", fontSize: 12 }} onClick={() => setSel(p)}>
                View Project
              </Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
