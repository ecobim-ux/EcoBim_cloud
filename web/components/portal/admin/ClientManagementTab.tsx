"use client";

import { useState } from "react";
import { readApprovals, writeApprovals, type Approval } from "@/lib/portal/storage";
import { ApprovalCard } from "./ApprovalCard";

export function ClientManagementTab() {
  const [approvals, setApprovals] = useState<Approval[]>(() => readApprovals());

  const updateApproval = (id: string, patch: Partial<Approval>) => {
    const next = approvals.map((a) => (a.id === id ? { ...a, ...patch } : a));
    setApprovals(next);
    writeApprovals(next);
  };

  const pendingAdmin = approvals.filter((a) => (a.stage || "") === "Lead Requested").length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0 6px", flexWrap: "wrap" }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>Approval tracker</div>
        {pendingAdmin > 0 && (
          <span style={{ background: "#FFF8EC", color: "#B7770D", border: "1px solid #F2E8D0", borderRadius: 20, padding: "3px 11px", fontSize: 11.5, fontWeight: 600 }}>
            {pendingAdmin} awaiting your review
          </span>
        )}
      </div>
      <div style={{ fontSize: 12.5, color: "#8A867C", marginBottom: 14, maxWidth: 640 }}>
        Team leads request your review before anything reaches a client. Review each one — suggest updates back to the lead, or approve and send to the client — then track its status and send email reminders here.
      </div>
      {approvals.length === 0 ? (
        <div style={{ background: "#fff", border: "1px dashed #E5E2DA", borderRadius: 12, padding: "28px", textAlign: "center", color: "#8A867C", fontSize: 13 }}>
          No approvals in the pipeline.
        </div>
      ) : (
        approvals.map((a) => <ApprovalCard key={a.id} a={a} onUpdate={updateApproval} />)
      )}
    </div>
  );
}
