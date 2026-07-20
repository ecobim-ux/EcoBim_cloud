"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchIssues, resolveIssue, type ApiIssue } from "@/lib/portal/issues";
import { Badge, Priority } from "../ui/Badge";
import { Btn } from "../ui/Btn";
import { RoleTag } from "../ui/RoleTag";
import { TableWrap, THead, TRow } from "../ui/Table";
import { notify } from "../ui/Toast";

export function OpenIssuesTable() {
  const [issues, setIssues] = useState<ApiIssue[]>([]);
  const tpl = "90px 1.2fr 1.6fr 1fr 90px 110px 100px";

  const load = useCallback(() => {
    fetchIssues().then(setIssues);
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

  return (
    <TableWrap>
      <THead cols={["Issue ID", "Raised By", "Description", "Priority", "Status", "Date", "Resolved"]} tpl={tpl} />
      {issues.map((i) => (
        <TRow key={i.id} tpl={tpl}>
          <span style={{ fontFamily: "var(--font-instrument-sans),sans-serif", fontSize: 12, fontWeight: 600, color: "#171717" }}>{i.code}</span>
          <span style={{ fontSize: 12, color: "#5C594F", display: "flex", alignItems: "center", gap: 5 }}>
            {i.by} <RoleTag role={i.raiserRole} />
          </span>
          <span style={{ fontSize: 12, color: "#5C594F", lineHeight: 1.4 }}>{i.desc}</span>
          <Priority p={i.sev} />
          <Badge s={i.resolved ? "Completed" : i.status} />
          <span style={{ fontFamily: "var(--font-instrument-sans),sans-serif", fontSize: 11, color: "#8A867C" }}>{i.date}</span>
          {i.resolved ? (
            <span style={{ fontSize: 12, fontWeight: 600, color: "#1A7A4A" }}>✓ Resolved</span>
          ) : (
            <Btn v="s" xs={{ padding: "4px 10px", fontSize: 11 }} onClick={() => resolve(i.id)}>
              Mark resolved
            </Btn>
          )}
        </TRow>
      ))}
    </TableWrap>
  );
}
