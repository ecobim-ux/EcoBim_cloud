"use client";

import { useEffect, useState } from "react";
import { fetchTeam, type ApiTeamMember } from "@/lib/portal/team";
import { Avi } from "../ui/Avi";
import { Badge } from "../ui/Badge";
import { PBar } from "../ui/PBar";
import { TableWrap, THead, TRow } from "../ui/Table";
import { EmployeeProductivityModal } from "./EmployeeProductivityModal";

export function AdminTeamTab() {
  const [team, setTeam] = useState<ApiTeamMember[]>([]);
  const [selected, setSelected] = useState<ApiTeamMember | null>(null);
  const tpl = "150px 130px 170px 2fr 110px 120px 130px";

  useEffect(() => {
    fetchTeam().then(setTeam);
  }, []);

  return (
    <TableWrap>
      {selected && <EmployeeProductivityModal member={selected} onClose={() => setSelected(null)} />}
      <THead cols={["Name", "Role", "Project", "Active Task", "Progress", "Status", "Last Active"]} tpl={tpl} />
      {team.map((m) => (
        <TRow key={m.partyId} tpl={tpl}>
          <button
            onClick={() => setSelected(m)}
            title={"View " + m.name + "'s productivity"}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
          >
            <Avi ini={m.initials} size={26} role="employee" />
            <span style={{ fontSize: 13, fontWeight: 500, color: "#171717" }}>{m.name}</span>
          </button>
          <span style={{ fontSize: 12, color: "#5C594F" }}>{m.role || "—"}</span>
          <span style={{ fontSize: 12, color: "#5C594F" }}>{m.project ? (m.project.length > 18 ? m.project.slice(0, 18) + "…" : m.project) : "—"}</span>
          <span style={{ fontSize: 13 }}>{m.task || "No active task"}</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <PBar pct={m.pct} status={m.status} label={m.name} />
            <span style={{ fontFamily: "var(--font-instrument-sans),sans-serif", fontSize: 11, color: "#8A867C" }}>{m.pct}%</span>
          </div>
          <Badge s={m.status} />
          <span style={{ fontFamily: "var(--font-instrument-sans),sans-serif", fontSize: 11, color: "#8A867C" }}>{m.lastActive || "—"}</span>
        </TRow>
      ))}
    </TableWrap>
  );
}
