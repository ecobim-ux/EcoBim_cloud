"use client";

import { useEffect, useState } from "react";
import { fetchApprovals, type ApiApproval } from "@/lib/portal/approvals";
import { AprStepper } from "../admin/AprStepper";

export function ApprovalsTab() {
  const [approvals, setApprovals] = useState<ApiApproval[]>([]);

  useEffect(() => {
    fetchApprovals().then(setApprovals);
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Approval Requests</h3>
        <p style={{ fontSize: 13, color: "#5C594F" }}>Track every deliverable you&apos;ve submitted for review, from admin review through freelance sign-off.</p>
      </div>
      {approvals.length === 0 ? (
        <div style={{ background: "#fff", border: "1px dashed #E5E2DA", borderRadius: 12, padding: "40px", textAlign: "center", color: "#8A867C", fontSize: 14 }}>
          No approval requests yet — use &ldquo;Request Freelance Approval&rdquo; above to start one.
        </div>
      ) : (
        approvals.map((a) => (
          <div key={a.id} style={{ background: "#fff", border: "1px solid #E5E2DA", borderRadius: 12, padding: "16px 18px", marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
              <div style={{ minWidth: 200 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{a.milestone}</div>
                <div style={{ fontSize: 12, color: "#8A867C", marginTop: 2 }}>
                  {a.proj} · {a.client} · submitted {a.submitted}
                </div>
              </div>
              <AprStepper stage={a.stage || "Sent to Freelance"} />
            </div>
            {a.leadNote && (
              <div style={{ marginTop: 12, fontSize: 12.5, color: "#5C594F", background: "#FAF9F6", border: "1px solid #F2F0EA", borderRadius: 9, padding: "9px 12px" }}>
                <b style={{ color: "#171717" }}>Your note:</b> {a.leadNote}
              </div>
            )}
            {a.adminNote && (
              <div style={{ marginTop: 8, fontSize: 12.5, color: "#5C594F", background: "#FFF8EC", border: "1px solid #F2E8D0", borderRadius: 9, padding: "9px 12px" }}>
                <b style={{ color: "#B7770D" }}>Admin requested updates:</b> {a.adminNote}
              </div>
            )}
            {a.stage === "Approved" && <div style={{ marginTop: 12, fontSize: 12.5, color: "#1A7A4A", fontWeight: 700 }}>✓ Approved by freelance</div>}
            {a.history && a.history.length > 0 && (
              <div style={{ marginTop: 13, borderTop: "1px dashed #E5E2DA", paddingTop: 11, display: "flex", flexDirection: "column", gap: 6 }}>
                {a.history.map((h, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 11.5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#C9C5BC", flexShrink: 0 }} />
                    <span style={{ color: "#5C594F" }}>{h.label}</span>
                    <span style={{ marginLeft: "auto", fontFamily: "var(--font-instrument-sans),sans-serif", color: "#8A867C" }}>{h.date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
