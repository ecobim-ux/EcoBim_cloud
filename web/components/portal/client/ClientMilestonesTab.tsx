"use client";

import { useState } from "react";
import { MILESTONES } from "@/lib/portal/data";
import { Btn } from "../ui/Btn";
import { notify } from "../ui/Toast";

const PENDING = [
  {
    id: "pend1",
    name: "Construction Docs LOD 350",
    desc: "Federated coordination model and full CD drawing set for Level 1–8.",
    submitted: "01 Aug 2025",
  },
];

export function ClientMilestonesTab() {
  const [approved, setApproved] = useState<string[]>([]);
  const [revised, setRevised] = useState<string[]>([]);
  const done = MILESTONES.filter((m) => m.done);

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Completed Milestones</div>
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E2DA", overflow: "hidden", marginBottom: 28 }}>
        {done.map((m, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: i < done.length - 1 ? "1px solid #F2F0EA" : "none" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#1A7A4A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{m.label}</div>
              <div style={{ fontFamily: "var(--font-instrument-sans),sans-serif", fontSize: 12, color: "#8A867C", marginTop: 2 }}>{m.date}</div>
            </div>
            <span style={{ fontSize: 12, color: "#8A867C" }}>CD Set, Model files</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Pending Your Approval</div>
      {PENDING.map((p) => (
        <div key={p.id} style={{ border: "1.5px solid #B8860B", borderRadius: 12, padding: "20px", background: "#FFF8E1", marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{p.name}</div>
            <span style={{ fontFamily: "var(--font-instrument-sans),sans-serif", fontSize: 11, color: "#B7770D", background: "#FFF8E1", padding: "3px 8px", borderRadius: 12 }}>
              Awaiting approval
            </span>
          </div>
          <p style={{ fontSize: 13, color: "#5C594F", marginBottom: 14, lineHeight: 1.55 }}>{p.desc}</p>
          <div style={{ fontSize: 12, color: "#8A867C", marginBottom: 16, fontFamily: "var(--font-instrument-sans),sans-serif" }}>Submitted: {p.submitted}</div>
          {approved.includes(p.id) ? (
            <div style={{ color: "#1A7A4A", fontWeight: 600, fontSize: 14 }}>✓ Approved — thank you</div>
          ) : revised.includes(p.id) ? (
            <div style={{ color: "#B7770D", fontWeight: 600, fontSize: 14 }}>↻ Revision requested — your team will follow up</div>
          ) : (
            <div style={{ display: "flex", gap: 10 }}>
              <Btn
                v="ok"
                onClick={() => {
                  setApproved((a) => [...a, p.id]);
                  notify("Approval recorded — thank you", "success");
                }}
              >
                ✓ Approve
              </Btn>
              <Btn
                v="d"
                onClick={() => {
                  setRevised((r) => [...r, p.id]);
                  notify("Revision request sent to your team", "info");
                }}
              >
                Request Revision
              </Btn>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
