"use client";

import { useState } from "react";
import { allIssues, roleKeyForName } from "@/lib/portal/helpers";
import { patchIssueFlags, readIssueFlags } from "@/lib/portal/storage";
import { Badge, Priority } from "../ui/Badge";
import { Btn } from "../ui/Btn";
import { RoleTag } from "../ui/RoleTag";
import { TableWrap, THead, TRow } from "../ui/Table";

export function OpenIssuesTable() {
  const [flags, setFlags] = useState(readIssueFlags);
  const tpl = "90px 1.2fr 1.6fr 1fr 90px 110px 100px";

  const resolve = (id: string) => setFlags(patchIssueFlags(id, { resolved: true }));

  return (
    <TableWrap>
      <THead cols={["Issue ID", "Raised By", "Description", "Priority", "Status", "Date", "Resolved"]} tpl={tpl} />
      {allIssues().map((i) => {
        const isResolved = !!flags[i.id]?.resolved;
        const raiserRole = roleKeyForName(i.by);
        return (
          <TRow key={i.id} tpl={tpl}>
            <span style={{ fontFamily: "var(--font-instrument-sans),sans-serif", fontSize: 12, fontWeight: 600, color: "#171717" }}>{i.id}</span>
            <span style={{ fontSize: 12, color: "#5C594F", display: "flex", alignItems: "center", gap: 5 }}>
              {i.by} <RoleTag role={raiserRole} />
            </span>
            <span style={{ fontSize: 12, color: "#5C594F", lineHeight: 1.4 }}>{i.desc}</span>
            <Priority p={i.sev} />
            <Badge s={isResolved ? "Completed" : i.status} />
            <span style={{ fontFamily: "var(--font-instrument-sans),sans-serif", fontSize: 11, color: "#8A867C" }}>{i.date.slice(0, 6)}</span>
            {isResolved ? (
              <span style={{ fontSize: 12, fontWeight: 600, color: "#1A7A4A" }}>✓ Resolved</span>
            ) : (
              <Btn v="s" xs={{ padding: "4px 10px", fontSize: 11 }} onClick={() => resolve(i.id)}>
                Mark resolved
              </Btn>
            )}
          </TRow>
        );
      })}
    </TableWrap>
  );
}
