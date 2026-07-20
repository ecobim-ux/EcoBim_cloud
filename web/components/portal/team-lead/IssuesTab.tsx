"use client";

import { useCallback, useEffect, useState } from "react";
import { escalateIssue, fetchIssues, respondToIssue, resolveIssue, type ApiIssue } from "@/lib/portal/issues";
import { usePeople } from "../PeopleProvider";
import { sendNotification } from "@/lib/portal/notifications";
import { Badge, SevColor } from "../ui/Badge";
import { Btn } from "../ui/Btn";
import { RoleTag } from "../ui/RoleTag";
import { notify } from "../ui/Toast";

export function IssuesTab({ userName }: { userName: string }) {
  const { people } = usePeople();
  const [list, setList] = useState<ApiIssue[]>([]);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [respText, setRespText] = useState("");

  const load = useCallback(() => {
    fetchIssues().then(setList);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resolve = async (id: string) => {
    const result = await resolveIssue(id);
    if (!result.ok) {
      notify(result.error || "Couldn't resolve that issue.", "error");
      return;
    }
    load();
  };

  const raiseToAdmin = async (issId: string, title: string, sev: string) => {
    const result = await escalateIssue(issId);
    if (!result.ok) {
      notify(result.error || "Couldn't escalate that issue.", "error");
      return;
    }
    sendNotification({
      recipientLoginIds: [people.find((p) => p.position === "admin")?.loginId],
      title: "⚠ Issue escalated by Team Lead",
      body: userName + ' raised "' + title + '" (' + sev + " priority) to your attention.",
      tab: "Team Management",
    });
    notify("Issue raised to Admin", "success");
    load();
  };

  const sendResponse = async (id: string, raisedBy: string, raiserRole: string) => {
    if (!respText.trim()) return;
    const result = await respondToIssue(id, respText.trim());
    if (!result.ok) {
      notify(result.error || "Couldn't send that response.", "error");
      return;
    }
    const raiserLoginId = people.find((p) => p.name === raisedBy)?.loginId;
    if (raiserLoginId) {
      sendNotification({
        recipientLoginIds: [raiserLoginId],
        title: "Team lead responded",
        body: userName + " responded to your issue: " + respText.trim(),
        tab: raiserRole === "employee" ? "RFIs" : "Issues",
      });
    }
    notify("Response sent", "success");
    setRespondingId(null);
    setRespText("");
    load();
  };

  return (
    <div>
      {list.map((iss) => {
        const isRes = iss.resolved;
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
                  Raised by {iss.by} <RoleTag role={iss.raiserRole} /> · {iss.date}
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
                {iss.raisedToAdmin ? (
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: "#8A867C" }}>✓ Raised to Admin</span>
                ) : (
                  <Btn v="d" xs={{ padding: "5px 12px", fontSize: 12 }} onClick={() => raiseToAdmin(iss.id, iss.title, iss.sev)}>
                    Raise to Admin
                  </Btn>
                )}
                {!responding && (
                  <Btn v="s" xs={{ padding: "5px 12px", fontSize: 12 }} onClick={() => { setRespondingId(iss.id); setRespText(iss.response || ""); }}>
                    {iss.response ? "Edit response" : "Respond"}
                  </Btn>
                )}
              </div>
            </div>
            <p style={{ fontSize: 13, color: "#5C594F", lineHeight: 1.55 }}>{iss.desc}</p>
            {iss.response && !responding && (
              <div style={{ marginTop: 10, background: "#F2F0EA", borderRadius: 9, padding: "9px 13px", fontSize: 12.5, color: "#171717" }}>
                <b>Your response ({iss.respondedDate}):</b> {iss.response}
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
                  <Btn v="p" xs={{ padding: "6px 14px", fontSize: 12 }} onClick={() => sendResponse(iss.id, iss.by, iss.raiserRole)}>
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
