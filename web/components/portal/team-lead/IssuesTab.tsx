"use client";

import { useState } from "react";
import { allIssues, roleKeyForName, todayStr } from "@/lib/portal/helpers";
import { addNotif, addRaisedIssue, patchIssueFlags, readIssueFlags, type RaisedIssue } from "@/lib/portal/storage";
import { Badge, SevColor } from "../ui/Badge";
import { Btn } from "../ui/Btn";
import { RoleTag } from "../ui/RoleTag";
import { notify } from "../ui/Toast";

export function IssuesTab() {
  const [flags, setFlags] = useState(readIssueFlags);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [respText, setRespText] = useState("");
  const list = allIssues();

  const resolve = (id: string) => setFlags(patchIssueFlags(id, { resolved: true }));

  const raiseToAdmin = (issId: string, title: string, desc: string, sev: string) => {
    const rec: RaisedIssue = {
      id: "ISS-" + String(Date.now()).slice(-3),
      title: "Escalated: " + title,
      by: "Pranav R.",
      to: "Admin",
      toRole: "admin",
      date: todayStr(),
      desc: "Raised to admin by team lead. Original: " + desc,
      sev,
      status: "Pending",
    };
    addRaisedIssue(rec);
    addNotif({ role: "admin", title: "⚠ Issue escalated by Team Lead", body: 'Pranav R. raised "' + title + '" (' + sev + " priority) to your attention.", tab: "Team Management" });
    setFlags(patchIssueFlags(issId, { raisedToAdmin: true }));
    notify("Issue raised to Admin", "success");
  };

  const sendResponse = (id: string, raisedBy: string) => {
    if (!respText.trim()) return;
    setFlags(patchIssueFlags(id, { response: respText.trim(), respondedBy: "Pranav R.", respondedDate: todayStr() }));
    const raiserRole = roleKeyForName(raisedBy);
    if (raiserRole) addNotif({ role: raiserRole, title: "Team lead responded", body: "Pranav R. responded to your issue: " + respText.trim(), tab: raiserRole === "employee" ? "RFIs" : "Issues" });
    notify("Response sent", "success");
    setRespondingId(null);
    setRespText("");
  };

  return (
    <div>
      {list.map((iss) => {
        const f = flags[iss.id] || {};
        const isRes = !!f.resolved;
        const raiserRole = roleKeyForName(iss.by);
        const responding = respondingId === iss.id;
        return (
          <div
            key={iss.id}
            style={{
              borderLeft: `3px solid ${SevColor[iss.sev]}`,
              background: "#fff",
              borderRadius: 12,
              padding: "16px 20px",
              border: "1px solid #E5E2DA",
              marginBottom: 12,
              boxShadow: "none",
              opacity: isRes ? 0.6 : 1,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                  {iss.title} {isRes && <span style={{ color: "#1A7A4A", fontSize: 12 }}>✓ Resolved</span>}
                </div>
                <div style={{ fontSize: 12, color: "#8A867C", fontFamily: "var(--font-instrument-sans),sans-serif", display: "flex", alignItems: "center", gap: 5 }}>
                  {iss.id} · Raised by {iss.by} <RoleTag role={raiserRole} /> · {iss.date}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: SevColor[iss.sev] }}>{iss.sev}</span>
                <Badge s={isRes ? "Completed" : iss.status} />
                {!isRes && (
                  <Btn v="s" xs={{ padding: "5px 12px", fontSize: 12 }} onClick={() => resolve(iss.id)}>
                    Resolve
                  </Btn>
                )}
                {f.raisedToAdmin ? (
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: "#8A867C" }}>✓ Raised to Admin</span>
                ) : (
                  <Btn v="d" xs={{ padding: "5px 12px", fontSize: 12 }} onClick={() => raiseToAdmin(iss.id, iss.title, iss.desc, iss.sev)}>
                    Raise to Admin
                  </Btn>
                )}
                {!responding && (
                  <Btn v="s" xs={{ padding: "5px 12px", fontSize: 12 }} onClick={() => { setRespondingId(iss.id); setRespText(f.response || ""); }}>
                    {f.response ? "Edit response" : "Respond"}
                  </Btn>
                )}
              </div>
            </div>
            <p style={{ fontSize: 13, color: "#5C594F", lineHeight: 1.55 }}>{iss.desc}</p>
            {f.response && !responding && (
              <div style={{ marginTop: 10, background: "#F2F0EA", borderRadius: 9, padding: "9px 13px", fontSize: 12.5, color: "#171717" }}>
                <b>Your response ({f.respondedDate}):</b> {f.response}
              </div>
            )}
            {responding && (
              <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
                <textarea
                  autoFocus
                  value={respText}
                  onChange={(e) => setRespText(e.target.value)}
                  placeholder="Write a response…"
                  style={{ flex: 1, minWidth: 220, minHeight: 60, padding: "8px 12px", border: "1px solid #E5E2DA", borderRadius: 10, fontSize: 13, resize: "vertical", fontFamily: "inherit" }}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <Btn v="p" xs={{ padding: "6px 14px", fontSize: 12 }} onClick={() => sendResponse(iss.id, iss.by)}>
                    Send
                  </Btn>
                  <Btn v="s" xs={{ padding: "6px 14px", fontSize: 12 }} onClick={() => { setRespondingId(null); setRespText(""); }}>
                    Cancel
                  </Btn>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
