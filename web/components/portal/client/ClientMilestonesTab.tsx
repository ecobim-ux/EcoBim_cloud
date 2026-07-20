"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchMilestones, type ApiMilestone } from "@/lib/portal/milestones";
import { fetchApprovals, transitionApproval, type ApiApproval } from "@/lib/portal/approvals";
import { Btn } from "../ui/Btn";
import { notify } from "../ui/Toast";

export function ClientMilestonesTab() {
  const [milestones, setMilestones] = useState<ApiMilestone[]>([]);
  const [approvals, setApprovals] = useState<ApiApproval[]>([]);
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  const loadApprovals = useCallback(() => {
    fetchApprovals().then(setApprovals);
  }, []);

  useEffect(() => {
    fetchMilestones().then(setMilestones);
    loadApprovals();
  }, [loadApprovals]);

  const done = milestones.filter((m) => m.done);
  const pending = approvals.filter((a) => a.stage === "Sent to Client");

  const respond = async (id: string, action: "APPROVE" | "REQUEST_REVISION") => {
    setBusy((b) => ({ ...b, [id]: true }));
    const result = await transitionApproval(id, action);
    setBusy((b) => ({ ...b, [id]: false }));
    if (!result.ok) {
      notify(result.error || "Couldn't record that response.", "error");
      return;
    }
    notify(action === "APPROVE" ? "Approval recorded — thank you" : "Revision request sent to your team", action === "APPROVE" ? "success" : "info");
    loadApprovals();
  };

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Completed Milestones</div>
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E2DA", overflow: "hidden", marginBottom: 28 }}>
        {done.map((m, i) => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: i < done.length - 1 ? "1px solid #F2F0EA" : "none" }}>
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
      {pending.length === 0 ? (
        <div style={{ background: "#fff", border: "1px dashed #E5E2DA", borderRadius: 12, padding: "24px", textAlign: "center", color: "#8A867C", fontSize: 13 }}>
          Nothing awaiting your approval right now.
        </div>
      ) : (
        pending.map((p) => (
          <div key={p.id} style={{ border: "1.5px solid #B8860B", borderRadius: 12, padding: "20px", background: "#FFF8E1", marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{p.milestone}</div>
              <span style={{ fontFamily: "var(--font-instrument-sans),sans-serif", fontSize: 11, color: "#B7770D", background: "#FFF8E1", padding: "3px 8px", borderRadius: 12 }}>
                Awaiting approval
              </span>
            </div>
            <p style={{ fontSize: 13, color: "#5C594F", marginBottom: 14, lineHeight: 1.55 }}>{p.proj}</p>
            <div style={{ fontSize: 12, color: "#8A867C", marginBottom: 16, fontFamily: "var(--font-instrument-sans),sans-serif" }}>Submitted: {p.submitted}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn v="ok" onClick={() => respond(p.id, "APPROVE")}>
                ✓ Approve
              </Btn>
              <Btn v="d" onClick={() => respond(p.id, "REQUEST_REVISION")}>
                Request Revision
              </Btn>
            </div>
            {busy[p.id] && <div style={{ fontSize: 11.5, color: "#8A867C", marginTop: 8 }}>Saving…</div>}
          </div>
        ))
      )}
    </div>
  );
}
