"use client";

import { useEffect, useState } from "react";
import { usePeople } from "../PeopleProvider";
import { createApprovalRequest } from "@/lib/portal/approvals";
import { fetchProjects, type ApiProject } from "@/lib/portal/projects";
import { sendNotification } from "@/lib/portal/notifications";
import { Btn } from "../ui/Btn";
import { notify } from "../ui/Toast";

export function LeadApprovalReqButton({ userName }: { userName: string }) {
  const { people } = usePeople();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [projects, setProjects] = useState<ApiProject[]>([]);

  useEffect(() => {
    fetchProjects().then(setProjects);
  }, []);

  const send = async () => {
    const proj = projects[0];
    const milestone = proj?.phaseLabel ? proj.phaseLabel + " Model Submission" : "Model Submission";
    setBusy(true);
    const result = await createApprovalRequest({
      title: milestone,
      projectName: proj?.name,
      note: "Model set is ready — please review before it goes to the client.",
    });
    setBusy(false);
    if (!result.ok) {
      notify(result.error || "Couldn't request approval.", "error");
      return;
    }
    sendNotification({
      recipientLoginIds: [people.find((p) => p.position === "admin")?.loginId],
      title: "Approval review requested",
      body: userName + ' requested your review of "' + milestone + '"' + (proj ? " on " + proj.name : "") + " before client submission.",
      tab: "Client Management",
    });
    setSent(true);
  };

  return (
    <Btn v="p" onClick={sent || busy ? undefined : send}>
      {sent ? "✓ Sent to Admin for review" : "✓ Request Client Approval"}
    </Btn>
  );
}
