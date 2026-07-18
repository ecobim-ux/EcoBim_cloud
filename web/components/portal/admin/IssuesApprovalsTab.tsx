"use client";

import { Fragment, useState } from "react";
import { allIssues } from "@/lib/portal/helpers";
import { Badge, Priority } from "../ui/Badge";
import { Btn } from "../ui/Btn";
import { TableWrap, THead, TRow } from "../ui/Table";

const APPROVALS = [
  { id: "a1", proj: "Dubai Marina Tower", milestone: "CD Model Submission", submitted: "08 Jul 2025", client: "Dubai Marina Dev." },
  { id: "a2", proj: "Downtown Mixed-Use Podium", milestone: "DD Coordination Model", submitted: "05 Jul 2025", client: "Emaar Properties" },
];

export function IssuesApprovalsTab() {
  const [sent, setSent] = useState<string[]>([]);
  const issTpl = "90px 180px 130px 80px 120px 100px 100px";
  const appTpl = "190px 200px 110px 160px 150px";

  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Open Issues</div>
      <TableWrap>
        <THead cols={["Issue ID", "Project", "Raised By", "Priority", "Status", "Date", "Action"]} tpl={issTpl} />
        {allIssues().map((i) => (
          <TRow key={i.id} tpl={issTpl}>
            <span style={{ fontFamily: "var(--font-instrument-sans),sans-serif", fontSize: 12, fontWeight: 600, color: "#171717" }}>{i.id}</span>
            <span style={{ fontSize: 12 }}>{(i as { project?: string }).project || "Dubai Marina Tower"}</span>
            <span style={{ fontSize: 12, color: "#5C594F" }}>{i.by}</span>
            <Priority p={i.sev} />
            <Badge s={i.status} />
            <span style={{ fontFamily: "var(--font-instrument-sans),sans-serif", fontSize: 11, color: "#8A867C" }}>{i.date.slice(0, 6)}</span>
            <Btn v="s" xs={{ padding: "4px 10px", fontSize: 11 }}>
              Review
            </Btn>
          </TRow>
        ))}
      </TableWrap>
      <div style={{ fontSize: 15, fontWeight: 600, margin: "28px 0 14px" }}>Pending Client Approvals</div>
      <TableWrap>
        <THead cols={["Project", "Milestone", "Submitted", "Client", "Action"]} tpl={appTpl} />
        {APPROVALS.map((a) => (
          <TRow key={a.id} tpl={appTpl}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{a.proj}</span>
            <span style={{ fontSize: 13 }}>{a.milestone}</span>
            <span style={{ fontFamily: "var(--font-instrument-sans),sans-serif", fontSize: 12, color: "#5C594F" }}>{a.submitted}</span>
            <span style={{ fontSize: 12, color: "#5C594F" }}>{a.client}</span>
            <div style={{ display: "flex", gap: 8 }}>
              {sent.includes(a.id) ? (
                <span style={{ fontSize: 12, color: "#1A7A4A", fontWeight: 600 }}>✓ Reminder sent</span>
              ) : (
                <Fragment>
                  <Btn v="ok" xs={{ padding: "5px 10px", fontSize: 11 }}>
                    Approve
                  </Btn>
                  <Btn v="s" xs={{ padding: "5px 10px", fontSize: 11 }} onClick={() => setSent((p) => [...p, a.id])}>
                    Send Reminder
                  </Btn>
                </Fragment>
              )}
            </div>
          </TRow>
        ))}
      </TableWrap>
    </div>
  );
}
