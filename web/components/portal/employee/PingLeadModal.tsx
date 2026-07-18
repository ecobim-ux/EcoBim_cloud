"use client";

import { useState } from "react";
import { addNotif } from "@/lib/portal/storage";
import { fldS, labS } from "@/lib/portal/style-tokens";
import { useModalA11y } from "../ui/useModalA11y";
import { notify } from "../ui/Toast";

interface PingLeadModalProps {
  userName: string;
  onClose: () => void;
}

export function PingLeadModal({ userName, onClose }: PingLeadModalProps) {
  const [subject, setSubject] = useState("");
  const [desc, setDesc] = useState("");
  const [sent, setSent] = useState(false);
  const dialogRef = useModalA11y(onClose);

  const submit = () => {
    if (!subject.trim() || !desc.trim()) return;
    addNotif({
      role: "teamlead",
      title: subject.trim(),
      body: userName + " pinged you — " + desc.trim(),
      tab: "Overview",
    });
    setSent(true);
    notify("Pinged your team lead", "info");
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
    maxWidth: 480,
    borderRadius: 16,
    boxShadow: "0 30px 80px rgba(0,0,0,.32)",
    overflow: "hidden",
    margin: "auto",
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div ref={dialogRef} tabIndex={-1} style={card} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Ping team lead">
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "18px 22px", borderBottom: "1px solid #E5E2DA", background: "#fff" }}>
          <span style={{ width: 32, height: 32, borderRadius: 9, background: "#171717", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>
            💬
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{sent ? "Ping sent" : "Ping Team Lead"}</div>
            <div style={{ fontSize: 12, color: "#8A867C" }}>{sent ? "Pranav R. has been notified" : "Send a quick note straight to Pranav R."}</div>
          </div>
          <button className="meet-x" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "none", background: "none", color: "#8A867C", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>
            ×
          </button>
        </div>
        <div style={{ padding: "20px 22px" }}>
          {!sent ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <span style={labS}>Subject</span>
                <input style={fldS} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Need clarification on Level 5 routing" />
              </div>
              <div>
                <span style={labS}>Description</span>
                <textarea
                  style={{ ...fldS, resize: "vertical", minHeight: 90, lineHeight: 1.5 }}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="What do you need from your team lead?"
                />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 2 }}>
                <button onClick={onClose} style={{ background: "#fff", border: "1.5px solid #E5E2DA", borderRadius: 12, padding: "10px 16px", fontSize: 13, fontWeight: 500, color: "#171717", cursor: "pointer" }}>
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={!subject.trim() || !desc.trim()}
                  style={{ background: !subject.trim() || !desc.trim() ? "#BDBAB2" : "#171717", color: "#fff", border: "none", borderRadius: 12, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: !subject.trim() || !desc.trim() ? "not-allowed" : "pointer" }}
                >
                  Send ping
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: 17, fontWeight: 600 }}>{subject}</div>
              <div style={{ fontSize: 13, color: "#5C594F", lineHeight: 1.55 }}>{desc}</div>
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
