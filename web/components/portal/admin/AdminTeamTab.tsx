"use client";

import { useState } from "react";
import { TEAM, type TeamMember } from "@/lib/portal/data";
import { Avi } from "../ui/Avi";
import { Badge } from "../ui/Badge";
import { PBar } from "../ui/PBar";
import { RoleTag } from "../ui/RoleTag";
import { TableWrap, THead, TRow } from "../ui/Table";
import { EmployeeProductivityModal } from "./EmployeeProductivityModal";

export function AdminTeamTab() {
  const [selected, setSelected] = useState<TeamMember | null>(null);
  const tpl = "150px 130px 170px 2fr 110px 120px 130px";
  return (
    <TableWrap>
      {selected && <EmployeeProductivityModal member={selected} onClose={() => setSelected(null)} />}
      <THead cols={["Name", "Role", "Project", "Active Task", "Progress", "Status", "Last Active"]} tpl={tpl} />
      {TEAM.map((m) => (
        <TRow key={m.id} tpl={tpl}>
          <button
            onClick={() => setSelected(m)}
            title={"View " + m.name + "'s productivity"}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
          >
            <Avi ini={m.ini} size={26} />
            <span style={{ fontSize: 13, fontWeight: 500, color: "#171717", display: "flex", alignItems: "center", gap: 5 }}>
              {m.name} <RoleTag role="employee" />
            </span>
          </button>
          <span style={{ fontSize: 12, color: "#5C594F" }}>{m.role}</span>
          <span style={{ fontSize: 12, color: "#5C594F" }}>{m.proj.length > 18 ? m.proj.slice(0, 18) + "…" : m.proj}</span>
          <span style={{ fontSize: 13 }}>{m.task}</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <PBar pct={m.pct} status={m.status} label={m.name} />
            <span style={{ fontFamily: "var(--font-instrument-sans),sans-serif", fontSize: 11, color: "#8A867C" }}>{m.pct}%</span>
          </div>
          <Badge s={m.status} />
          <span style={{ fontFamily: "var(--font-instrument-sans),sans-serif", fontSize: 11, color: "#8A867C" }}>{m.last}</span>
        </TRow>
      ))}
    </TableWrap>
  );
}
