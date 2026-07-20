"use client";

import { Fragment, useState } from "react";
import { usePeople } from "../PeopleProvider";
import { transitionApproval, type ApiApproval } from "@/lib/portal/approvals";
import { CO_EMAIL, ML } from "@/lib/portal/mail";
import { sendNotification } from "@/lib/portal/notifications";
import { fldS } from "@/lib/portal/style-tokens";
import { Btn } from "../ui/Btn";
import { notify } from "../ui/Toast";
import { AprStepper } from "./AprStepper";

interface ApprovalCardProps {
  a: ApiApproval;
  onChange: () => void;
}

export function ApprovalCard({ a, onChange }: ApprovalCardProps) {
  const { people } = usePeople();
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const stage = a.stage || "Sent to Client";

  const reminderMail = ML(
    a.clientEmail || "",
    "Reminder: approval needed — " + a.milestone,
    "Dear " + a.client + ',\n\nThis is a reminder that "' + a.milestone + '" for ' + a.proj + " is awaiting your approval.\n\nPlease review and sign off at your convenience.\n\nRegards,\nEcoBIM\n" + CO_EMAIL,
  );
  const clientMail = ML(
    a.clientEmail || "",
    "Approval request — " + a.milestone + " [" + a.proj + "]",
    "Dear " + a.client + ",\n\nPlease review and approve the following deliverable:\n\nProject: " + a.proj + "\nMilestone: " + a.milestone + "\n\nRegards,\nEcoBIM\n" + CO_EMAIL,
  );

  const run = async (action: Parameters<typeof transitionApproval>[1], n?: string) => {
    setBusy(true);
    const result = await transitionApproval(a.id, action, n);
    setBusy(false);
    if (!result.ok) {
      notify(result.error || "Couldn't complete that action.", "error");
      return false;
    }
    return true;
  };

  const suggest = async () => {
    if (!note.trim()) return;
    if (!(await run("SUGGEST_UPDATES", note.trim()))) return;
    sendNotification({
      recipientLoginIds: [people.find((p) => p.position === "teamlead")?.loginId],
      title: "Updates requested by Admin",
      body: 'Admin suggested updates on "' + a.milestone + '" (' + a.proj + "): " + note.trim(),
      tab: "Approvals",
    });
    setOpen(false);
    setNote("");
    onChange();
  };

  const sendClient = async () => {
    if (!(await run("SEND_TO_CLIENT"))) return;
    sendNotification({
      recipientLoginIds: [people.find((p) => p.email === a.clientEmail)?.loginId],
      title: "Approval requested",
      body: a.milestone + " for " + a.proj + " is awaiting your approval.",
      tab: "Milestones & Approvals",
    });
    setOpen(false);
    notify("Sent to client for approval", "success");
    onChange();
    try {
      window.location.href = clientMail;
    } catch {
      /* noop */
    }
  };

  const markApproved = async () => {
    if (!(await run("APPROVE"))) return;
    notify("Marked as approved", "success");
    onChange();
  };

  const sendReminder = async () => {
    await run("REMIND");
    onChange();
  };

  return (
    <div style={{ background: "#fff", border: "1px solid #E5E2DA", borderRadius: 12, padding: "16px 18px", marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
        <div style={{ minWidth: 200 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{a.milestone}</div>
          <div style={{ fontSize: 12, color: "#8A867C", marginTop: 2 }}>
            {a.proj} · {a.client} · requested by {a.by || "Team Lead"} · {a.submitted}
          </div>
        </div>
        <AprStepper stage={stage} />
      </div>
      {a.leadNote && (
        <div style={{ marginTop: 12, fontSize: 12.5, color: "#5C594F", background: "#FAF9F6", border: "1px solid #F2F0EA", borderRadius: 9, padding: "9px 12px" }}>
          <b style={{ color: "#171717" }}>Team lead:</b> {a.leadNote}
        </div>
      )}
      {a.adminNote && (
        <div style={{ marginTop: 8, fontSize: 12.5, color: "#5C594F", background: "#FFF8EC", border: "1px solid #F2E8D0", borderRadius: 9, padding: "9px 12px" }}>
          <b style={{ color: "#B7770D" }}>Admin → team lead:</b> {a.adminNote}
        </div>
      )}
      <div style={{ marginTop: 13, display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap" }}>
        {stage === "Lead Requested" &&
          (open ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", width: "100%" }}>
              <input
                style={{ ...fldS, flex: 1, minWidth: 220 }}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What should the team lead update before this goes to the client?"
              />
              <Btn v="p" xs={{ padding: "7px 14px", fontSize: 12 }} onClick={suggest}>
                Send to team lead
              </Btn>
              <Btn
                v="s"
                xs={{ padding: "6px 12px", fontSize: 12 }}
                onClick={() => {
                  setOpen(false);
                  setNote("");
                }}
              >
                Cancel
              </Btn>
            </div>
          ) : (
            <Fragment>
              <Btn v="p" xs={{ padding: "7px 14px", fontSize: 12 }} onClick={sendClient}>
                ✓ Approve &amp; send to client
              </Btn>
              <Btn v="s" xs={{ padding: "6px 14px", fontSize: 12 }} onClick={() => setOpen(true)}>
                Suggest updates to lead
              </Btn>
            </Fragment>
          ))}
        {stage === "Changes Requested" && (
          <Fragment>
            <span style={{ fontSize: 12, color: "#B7770D", fontWeight: 600 }}>⏳ Awaiting team lead update</span>
            <Btn v="s" xs={{ padding: "6px 14px", fontSize: 12 }} onClick={sendClient}>
              Send to client anyway
            </Btn>
          </Fragment>
        )}
        {stage === "Sent to Client" && (
          <Fragment>
            <span style={{ fontSize: 12, color: "#1A56C4", fontWeight: 600 }}>↗ Awaiting client approval</span>
            {a.lastReminder ? (
              <span style={{ fontSize: 12, color: "#1A7A4A", fontWeight: 600 }}>✓ Reminder sent</span>
            ) : (
              <a
                href={reminderMail}
                onClick={sendReminder}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fff", color: "#171717", border: "1.5px solid #171717", borderRadius: 12, padding: "6px 13px", fontSize: 12, fontWeight: 600, textDecoration: "none" }}
              >
                ✉ Send email reminder
              </a>
            )}
            <Btn v="ok" xs={{ padding: "7px 14px", fontSize: 12 }} onClick={markApproved}>
              Mark approved
            </Btn>
          </Fragment>
        )}
        {stage === "Approved" && <span style={{ fontSize: 12.5, color: "#1A7A4A", fontWeight: 700 }}>✓ Approved by client</span>}
        {busy && <span style={{ fontSize: 11.5, color: "#8A867C" }}>Saving…</span>}
      </div>
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
  );
}
