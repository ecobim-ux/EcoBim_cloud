"use client";

import { useState } from "react";
import { RFIS, TEAM } from "@/lib/portal/data";
import { Badge, Priority } from "../ui/Badge";
import { Btn } from "../ui/Btn";
import { TableWrap, THead, TRow } from "../ui/Table";

export function RFIsTab({ extraCol }: { extraCol?: boolean }) {
  const [assigned, setAssigned] = useState<Record<string, string>>({});
  const tpl = extraCol ? "110px 2fr 120px 110px 80px 110px 110px" : "110px 2fr 120px 110px 80px";
  const cols = extraCol
    ? ["RFI ID", "Title", "Status", "Raised", "Priority", "Assign To", "Action"]
    : ["RFI ID", "Title", "Status", "Raised", "Priority"];
  return (
    <TableWrap>
      <THead cols={cols} tpl={tpl} />
      {RFIS.map((r) => (
        <TRow key={r.id} tpl={tpl}>
          <span style={{ fontFamily: "var(--font-instrument-sans),sans-serif", fontSize: 12, fontWeight: 600, color: "#171717" }}>{r.id}</span>
          <span style={{ fontSize: 14 }}>{r.title}</span>
          <Badge s={r.status} />
          <span style={{ fontFamily: "var(--font-instrument-sans),sans-serif", fontSize: 12, color: "#5C594F" }}>{r.raised}</span>
          <Priority p={r.priority} />
          {extraCol && (
            <select
              value={assigned[r.id] || ""}
              onChange={(e) => setAssigned((p) => ({ ...p, [r.id]: e.target.value }))}
              style={{ padding: "5px 8px", border: "1px solid #E5E2DA", borderRadius: 12, fontSize: 12, background: "#F6F4EF", color: "#171717" }}
            >
              <option value="">—</option>
              {TEAM.map((t) => (
                <option key={t.id}>{t.name}</option>
              ))}
            </select>
          )}
          {extraCol && (
            <Btn v="s" xs={{ padding: "5px 12px", fontSize: 12 }}>
              Respond
            </Btn>
          )}
        </TRow>
      ))}
    </TableWrap>
  );
}
