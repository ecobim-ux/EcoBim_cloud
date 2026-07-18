"use client";

import { useState } from "react";
import { addNotif, readApprovals, writeApprovals } from "@/lib/portal/storage";
import { CLIENT_EMAILS, todayStr } from "@/lib/portal/helpers";
import { Btn } from "../ui/Btn";

export function LeadApprovalReqButton() {
  const [sent, setSent] = useState(false);

  const send = () => {
    const proj = "Dubai Marina Tower";
    const a = {
      id: "APR-" + String(Date.now()).slice(-5),
      proj,
      milestone: "CD Model Submission",
      submitted: todayStr(),
      client: "Dubai Marina Dev.",
      clientEmail: CLIENT_EMAILS[proj] || "",
      by: "Pranav R.",
      stage: "Lead Requested",
      leadNote: "CD set is ready — please review before it goes to the client.",
      adminNote: "",
      lastReminder: null,
      history: [{ label: "Team lead requested admin review", date: todayStr() }],
    };
    writeApprovals([a, ...readApprovals()]);
    addNotif({
      role: "admin",
      title: "Approval review requested",
      body: 'Pranav R. requested your review of "' + a.milestone + '" on ' + proj + " before client submission.",
      tab: "Client Management",
    });
    setSent(true);
  };

  return (
    <Btn v="p" onClick={sent ? undefined : send}>
      {sent ? "✓ Sent to Admin for review" : "✓ Request Client Approval"}
    </Btn>
  );
}
