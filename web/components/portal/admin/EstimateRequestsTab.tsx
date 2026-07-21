"use client";

import { useCallback, useEffect, useState } from "react";
import { usePeople } from "../PeopleProvider";
import { assignLeadToTeamLead, fetchLeads, markLeadContacted, type ApiLead } from "@/lib/portal/leads";
import { CO_EMAIL, LEAD_EMAIL, LEAD_NAME, ML } from "@/lib/portal/mail";
import { Avi } from "../ui/Avi";
import { Btn } from "../ui/Btn";
import { ReqBadge } from "../shared/ReqBadge";
import { notify } from "../ui/Toast";

export function EstimateRequestsTab() {
  const [reqs, setReqs] = useState<ApiLead[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [assignLead, setAssignLead] = useState<Record<string, string>>({});
  const { people } = usePeople();
  const teamLeads = people.filter((p) => p.position === "teamlead");

  const refresh = useCallback(() => {
    fetchLeads().then(setReqs);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const markContacted = async (id: string) => {
    const result = await markLeadContacted(id);
    if (!result.ok) {
      notify(result.error || "Couldn't update that request.", "error");
      return;
    }
    refresh();
  };

  const assignToLead = async (id: string) => {
    const loginId = assignLead[id] || teamLeads[0]?.loginId;
    if (!loginId) return;
    const result = await assignLeadToTeamLead(id, loginId);
    if (!result.ok) {
      notify(result.error || "Couldn't assign that request.", "error");
      return;
    }
    refresh();
  };

  const newCount = reqs.filter((r) => r.status === "New").length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Incoming Estimate Requests</h3>
          <p style={{ fontSize: 13, color: "#5C594F" }}>Submitted via the EcoBIM website contact form</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {newCount > 0 && (
            <span style={{ background: "#FDECEA", color: "#C0392B", padding: "4px 12px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
              🔴 {newCount} new
            </span>
          )}
          <Btn v="g" xs={{ border: "1px solid #E5E2DA", fontSize: 12 }} onClick={refresh}>
            ↻ Refresh
          </Btn>
        </div>
      </div>
      {reqs.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px dashed #E5E2DA", padding: "40px", textAlign: "center", color: "#8A867C", fontSize: 14 }}>
          No requests yet — they appear here when submitted via the website.
        </div>
      )}
      {reqs.map((r) => (
        <div key={r.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E2DA", marginBottom: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}>
          <div
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", cursor: "pointer", borderBottom: expanded === r.id ? "1px solid #F2F0EA" : "none" }}
            onClick={() => setExpanded((e) => (e === r.id ? null : r.id))}
          >
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <Avi
                ini={r.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                size={38}
                bg={r.status === "New" ? "#171717" : r.status === "Contacted" ? "#B8860B" : "#1A7A4A"}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {r.name} <span style={{ fontWeight: 400, color: "#5C594F" }}>— {r.company}</span>
                </div>
                <div style={{ fontSize: 12, color: "#8A867C", marginTop: 2, fontFamily: "var(--font-instrument-sans),sans-serif" }}>
                  {r.code} · {r.date} · {r.role}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <ReqBadge s={r.status} />
              {r.assignedTo && <span style={{ fontSize: 12, color: "#5C594F" }}>→ {r.assignedTo}</span>}
              <span style={{ color: "#8A867C", fontSize: 12 }}>{expanded === r.id ? "▲" : "▼"}</span>
            </div>
          </div>
          {expanded === r.id && (
            <div style={{ padding: "18px 20px", background: "#F6F4EF" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E2DA", padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#8A867C", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                    Request Details
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "#8A867C", width: 80, flexShrink: 0 }}>Scale</span>
                      <span style={{ fontSize: 13 }}>{r.scale || "—"}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "#8A867C", width: 80, flexShrink: 0 }}>Services</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {(r.services || []).map((s) => (
                          <span key={s} style={{ background: "#F2F0EA", color: "#171717", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 12, color: "#8A867C", width: 80, flexShrink: 0 }}>Details</span>
                      <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.55 }}>{r.details || "—"}</span>
                    </div>
                  </div>
                </div>
                <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E2DA", padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#8A867C", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                    Contact &amp; Actions
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "#8A867C", width: 56, flexShrink: 0 }}>Email</span>
                      {r.email ? (
                        <a
                          href={ML(
                            r.email,
                            `Re: Your BIM Estimate Request [${r.code}]`,
                            `Dear ${r.name},\n\nThank you for reaching out to EcoBIM.\n\nWe have reviewed your request for ${(r.services || []).join(", ")} at ${r.company} and would like to discuss further.\n\nPlease let us know a convenient time to connect.\n\nBest regards,\nEcoBIM Team\n${CO_EMAIL}`,
                          )}
                          style={{ fontSize: 13, color: "#171717", textDecoration: "none", fontWeight: 500 }}
                        >
                          {r.email} ↗
                        </a>
                      ) : (
                        <span style={{ fontSize: 13, color: "#8A867C" }}>—</span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "#8A867C", width: 56, flexShrink: 0 }}>Phone</span>
                      <span style={{ fontSize: 13 }}>{r.phone || "—"}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {r.status === "New" && (
                      <a
                        href={
                          r.email
                            ? ML(
                                r.email,
                                `Initial Contact — Your BIM Request [${r.code}]`,
                                `Dear ${r.name},\n\nThank you for your interest in EcoBIM's services.\n\nWe received your estimate request for ${r.company} and our team is reviewing the details. We will be in touch shortly.\n\nBest regards,\nEcoBIM Team\n${CO_EMAIL}`,
                              )
                            : "#"
                        }
                        onClick={() => markContacted(r.id)}
                        className="btn-s"
                        style={{ background: "#fff", color: "#171717", border: "1.5px solid #171717", padding: "7px 12px", borderRadius: 12, fontSize: 12, fontWeight: 500, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, transition: "background .15s" }}
                      >
                        📧 Email &amp; Mark Contacted
                      </a>
                    )}
                    {r.status !== "Assigned" && (
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <select
                          value={assignLead[r.id] || teamLeads[0]?.loginId || ""}
                          onChange={(e) => setAssignLead((p) => ({ ...p, [r.id]: e.target.value }))}
                          style={{ flex: 1, padding: "7px 10px", border: "1px solid #E5E2DA", borderRadius: 12, fontSize: 12, background: "#F6F4EF", color: "#171717" }}
                        >
                          {teamLeads.map((p) => (
                            <option key={p.loginId} value={p.loginId}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        <Btn v="p" xs={{ fontSize: 12, padding: "7px 14px" }} onClick={() => assignToLead(r.id)}>
                          Assign Lead →
                        </Btn>
                      </div>
                    )}
                    {r.status === "Assigned" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ color: "#1A7A4A", fontSize: 13, fontWeight: 500 }}>
                          ✓ Assigned to {r.assignedTo}
                          {r.assignedEmployee && ` → ${r.assignedEmployee}`}
                        </div>
                        <a
                          href={ML(
                            LEAD_EMAIL,
                            `Project Assigned: ${r.company} [${r.code}]`,
                            `Hi ${LEAD_NAME},\n\nYou have been assigned:\n\nFreelance: ${r.name} (${r.company})\nRole: ${r.role}\nScale: ${r.scale || "TBD"}\nServices: ${(r.services || []).join(", ")}\n\nDetails: ${r.details || "See portal"}\n\nPlease log in and assign to an employee.\n\nRegards, Admin\n${CO_EMAIL}`,
                          )}
                          style={{ fontSize: 12, color: "#171717", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 500 }}
                        >
                          📧 Notify Team Lead by email ↗
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
