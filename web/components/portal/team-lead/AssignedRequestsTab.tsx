"use client";

import { useState } from "react";
import { TEAM } from "@/lib/portal/data";
import { addAssignedTask, addNotif, readRequests, writeRequests, type EstimateRequest } from "@/lib/portal/storage";
import { ML, LEAD_EMAIL, LEAD_NAME } from "@/lib/portal/mail";
import { Btn } from "../ui/Btn";
import { ReqBadge } from "../shared/ReqBadge";

export function AssignedRequestsTab() {
  const [reqs, setReqs] = useState<EstimateRequest[]>(() => readRequests().filter((r) => r.assignedTo === "Pranav R."));
  const [assignEmp, setAssignEmp] = useState<Record<string, string>>({});
  const [note, setNote] = useState<Record<string, string>>({});
  const [done, setDone] = useState<Record<string, boolean>>({});

  const assignToEmployee = (id: string) => {
    const emp = assignEmp[id] || TEAM[0].name;
    const req = reqs.find((r) => r.id === id) || ({} as EstimateRequest);
    const all = readRequests();
    const updated = all.map((r) => (r.id === id ? { ...r, assignedEmployee: emp } : r));
    writeRequests(updated);
    setReqs(updated.filter((r) => r.assignedTo === "Pranav R."));
    setDone((p) => ({ ...p, [id]: true }));
    addAssignedTask({
      id: "AT" + Date.now(),
      assignedTo: emp,
      task: `Review estimate: ${req.company || "Client"} — ${(req.services || []).join(", ")}`,
      del: "RFI",
      lod: "LOD 300",
      phase: "CD",
      status: "Not Started",
      pct: 0,
      due: "TBD",
      delay: null,
    });
    addNotif({
      role: "employee",
      title: "New task assigned by Team Lead",
      body: `Pranav R. assigned: Review ${req.company || "client"} estimate — ${(req.services || []).join(", ")}.`,
      tab: "My Tasks",
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Requests Assigned to You</h3>
        <p style={{ fontSize: 13, color: "#5C594F" }}>Review each request and assign to an employee to action.</p>
      </div>
      {reqs.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px dashed #E5E2DA", padding: "40px", textAlign: "center", color: "#8A867C", fontSize: 14 }}>
          No requests assigned to you yet.
        </div>
      )}
      {reqs.map((r) => (
        <div key={r.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E2DA", marginBottom: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #F2F0EA" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {r.name} <span style={{ fontWeight: 400, color: "#5C594F" }}>— {r.company}</span>
                </div>
                <div style={{ fontSize: 12, color: "#8A867C", marginTop: 2, fontFamily: "var(--font-instrument-sans),sans-serif" }}>
                  {r.id} · {r.date} · {r.role}
                </div>
              </div>
              <ReqBadge s={r.status} />
            </div>
            <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.55, marginBottom: 10 }}>{r.details}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              {(r.services || []).map((s) => (
                <span key={s} style={{ background: "#F2F0EA", color: "#171717", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                  {s}
                </span>
              ))}
              {r.scale && <span style={{ background: "#F5F5F5", color: "#5C594F", padding: "2px 8px", borderRadius: 12, fontSize: 11 }}>{r.scale}</span>}
            </div>
            {r.assignedEmployee ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ color: "#1A7A4A", fontSize: 13, fontWeight: 500 }}>✓ Task assigned to {r.assignedEmployee}</div>
                {(() => {
                  const emp = TEAM.find((t) => t.name === r.assignedEmployee);
                  return emp ? (
                    <a
                      href={ML(
                        emp.email,
                        `Task Assignment: ${r.company} Estimate`,
                        `Hi ${emp.name.split(" ")[0]},\n\nYou have a new task assigned by ${LEAD_NAME}.\n\nClient: ${r.name} (${r.company})\nServices: ${(r.services || []).join(", ")}\nScale: ${r.scale || "TBD"}\n\nBrief: ${r.details || "See portal for full details"}\n\nPlease log into the portal to review and action.\n\nBest,\n${LEAD_NAME}\n${LEAD_EMAIL}`,
                      )}
                      style={{ fontSize: 12, color: "#171717", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 500 }}
                    >
                      📧 Notify {emp.name.split(" ")[0]} by email ↗
                    </a>
                  ) : null;
                })()}
              </div>
            ) : done[r.id] ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ color: "#1A7A4A", fontSize: 13, fontWeight: 500 }}>✓ Assigned to {assignEmp[r.id] || TEAM[0].name}</div>
                {(() => {
                  const n = assignEmp[r.id] || TEAM[0].name;
                  const emp = TEAM.find((t) => t.name === n);
                  return emp ? (
                    <a
                      href={ML(
                        emp.email,
                        `Task Assignment: ${r.company} Estimate`,
                        `Hi ${emp.name.split(" ")[0]},\n\nYou have a new task assigned by ${LEAD_NAME}.\n\nClient: ${r.name} (${r.company})\nServices: ${(r.services || []).join(", ")}\nScale: ${r.scale || "TBD"}\n\nBrief: ${r.details || "See portal for full details"}\n\nPlease log into the portal to review and action.\n\nBest,\n${LEAD_NAME}\n${LEAD_EMAIL}`,
                      )}
                      style={{ fontSize: 12, color: "#171717", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 500 }}
                    >
                      📧 Notify {emp.name.split(" ")[0]} by email ↗
                    </a>
                  ) : null;
                })()}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#5C594F" }}>Assign to employee</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <select
                    value={assignEmp[r.id] || TEAM[0].name}
                    onChange={(e) => setAssignEmp((p) => ({ ...p, [r.id]: e.target.value }))}
                    style={{ flex: 1, padding: "8px 10px", border: "1px solid #E5E2DA", borderRadius: 12, fontSize: 13, background: "#F6F4EF", color: "#171717" }}
                  >
                    {TEAM.map((t) => (
                      <option key={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <Btn v="p" xs={{ fontSize: 12, padding: "8px 16px" }} onClick={() => assignToEmployee(r.id)}>
                    Assign →
                  </Btn>
                </div>
                <textarea
                  rows={2}
                  placeholder="Add a note for the employee (optional)"
                  value={note[r.id] || ""}
                  onChange={(e) => setNote((p) => ({ ...p, [r.id]: e.target.value }))}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid #E5E2DA", borderRadius: 12, fontSize: 13, background: "#F6F4EF", resize: "vertical" }}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
