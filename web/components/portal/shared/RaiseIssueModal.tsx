"use client";

import { useEffect, useState } from "react";
import { POS_LABEL } from "@/lib/portal/people";
import { usePeople } from "../PeopleProvider";
import { raiseIssue } from "@/lib/portal/issues";
import { sendNotification } from "@/lib/portal/notifications";
import { fldS, labS } from "@/lib/portal/style-tokens";
import { SevColor } from "../ui/Badge";
import { useModalA11y } from "../ui/useModalA11y";
import { notify } from "../ui/Toast";
import { WarnIcon } from "../ui/icons";

interface RaiseIssueModalProps {
  role: string;
  userName: string;
  onClose: () => void;
}

interface DoneState {
  title: string;
  to: string;
  sev: string;
}

export function RaiseIssueModal({ userName, onClose }: RaiseIssueModalProps) {
  const { people: allPeople } = usePeople();
  const people = allPeople.filter((p) => p.name !== userName && p.position !== "client");
  const [to, setTo] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [sev, setSev] = useState("Medium");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<DoneState | null>(null);
  const dialogRef = useModalA11y(onClose);

  useEffect(() => {
    if (!to && people.length > 0) setTo(people[0].partyId);
  }, [people, to]);

  const submit = async () => {
    if (!title.trim() || !desc.trim() || !to) return;
    const rec = people.find((p) => p.partyId === to);
    if (!rec) return;
    setBusy(true);
    const result = await raiseIssue({ title: title.trim(), description: desc.trim(), severity: sev, recipientLoginId: rec.loginId });
    setBusy(false);
    if (!result.ok) {
      notify(result.error || "Couldn't raise that issue.", "error");
      return;
    }
    sendNotification({
      recipientLoginIds: [rec.loginId],
      title: "⚠ New issue raised",
      body: userName + ' raised "' + title.trim() + '" (' + sev + " priority). " + desc.trim(),
      tab: rec.position === "admin" ? "Team Management" : rec.position === "employee" ? "RFIs" : "Issues & RFIs",
    });
    setDone({ title: title.trim(), to: rec.name, sev });
    notify("Issue raised and routed", "success");
  };

  const overlay = {
    position: "fixed" as const,
    inset: 0,
    zIndex: 300,
    background: "rgba(23,23,23,.5)",
    backdropFilter: "blur(3px)",
    WebkitBackdropFilter: "blur(3px)",
    display: "flex" as const,
    alignItems: "flex-start" as const,
    justifyContent: "center" as const,
    padding: "40px 16px",
    overflowY: "auto" as const,
  };
  const card = {
    background: "#FAF9F6",
    width: "100%",
    maxWidth: 520,
    borderRadius: 16,
    boxShadow: "0 30px 80px rgba(0,0,0,.32)",
    overflow: "hidden",
    margin: "auto",
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div ref={dialogRef} tabIndex={-1} style={card} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Raise an issue">
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "18px 22px", borderBottom: "1px solid #E5E2DA", background: "#fff" }}>
          <span style={{ width: 32, height: 32, borderRadius: 9, background: "#C0392B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <WarnIcon size={17} />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{done ? "Issue raised" : "Raise an issue"}</div>
            <div style={{ fontSize: 12, color: "#8A867C" }}>{done ? "Added to the RFI / Issue system" : "Routed to the recipient and the issue log"}</div>
          </div>
          <button className="meet-x" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "none", background: "none", color: "#8A867C", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>
            ×
          </button>
        </div>
        <div style={{ padding: "20px 22px" }}>
          {!done ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 12 }}>
                <div>
                  <span style={labS}>Send to</span>
                  <select style={fldS} value={to} onChange={(e) => setTo(e.target.value)}>
                    {people.map((p) => (
                      <option key={p.partyId} value={p.partyId}>
                        {p.name} — {POS_LABEL[p.position] || p.position}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span style={labS}>Priority</span>
                  <select style={fldS} value={sev} onChange={(e) => setSev(e.target.value)}>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>
              <div>
                <span style={labS}>Issue title</span>
                <input style={fldS} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. MEP–Structural clash, Level 9" />
              </div>
              <div>
                <span style={labS}>Description</span>
                <textarea
                  style={{ ...fldS, resize: "vertical", minHeight: 90, lineHeight: 1.5 }}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Describe the issue, location, and what's needed to resolve it…"
                />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 2 }}>
                <button onClick={onClose} style={{ background: "#fff", border: "1.5px solid #E5E2DA", borderRadius: 12, padding: "10px 16px", fontSize: 13, fontWeight: 500, color: "#171717", cursor: "pointer" }}>
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={busy || !title.trim() || !desc.trim() || !to}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, background: busy || !title.trim() || !desc.trim() || !to ? "#BDBAB2" : "#C0392B", color: "#fff", border: "none", borderRadius: 12, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: busy || !title.trim() || !desc.trim() || !to ? "not-allowed" : "pointer" }}
                >
                  <WarnIcon size={14} /> Submit issue
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: 17, fontWeight: 600 }}>{done.title}</div>
              <div style={{ background: "#fff", border: "1px solid #E5E2DA", borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 9 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "#8A867C" }}>Sent to</span>
                  <span style={{ fontWeight: 500 }}>{done.to}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "#8A867C" }}>Priority</span>
                  <span style={{ fontWeight: 600, color: SevColor[done.sev] }}>{done.sev}</span>
                </div>
              </div>
              <div style={{ fontSize: 12.5, color: "#8A867C", lineHeight: 1.55 }}>
                {done.to} has been notified in their portal. The issue now appears in the Issues log and the recipient&apos;s RFI / Issue list.
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={onClose} style={{ background: "#171717", color: "#fff", border: "none", borderRadius: 12, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
