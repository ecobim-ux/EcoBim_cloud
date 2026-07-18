import { TEAM } from "@/lib/portal/data";
import { Avi } from "../ui/Avi";
import { Badge } from "../ui/Badge";
import { PBar } from "../ui/PBar";
import { RoleTag } from "../ui/RoleTag";
import { TableWrap, THead, TRow } from "../ui/Table";
import { LOD } from "../ui/icons";
import { ManageTeamSection } from "./ManageTeamSection";

export function MyTeamTab() {
  const tpl = "160px 130px 2fr 90px 120px 120px 70px";
  return (
    <div>
      <ManageTeamSection />
      <TableWrap>
        <THead cols={["Member", "Role", "Active Task", "LOD", "Progress", "Status", "Hours"]} tpl={tpl} />
        {TEAM.map((m) => (
          <TRow key={m.id} tpl={tpl}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avi ini={m.ini} size={28} />
              <span style={{ fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
                {m.name} <RoleTag role="employee" />
                {m.hasDelay && <span style={{ color: "#B8860B", marginLeft: 4 }}>⚠</span>}
              </span>
            </div>
            <span style={{ fontSize: 12, color: "#5C594F" }}>{m.role}</span>
            <span style={{ fontSize: 13 }}>{m.task}</span>
            <LOD v={m.lod} />
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <PBar pct={m.pct} status={m.status} label={m.name} />
              <span style={{ fontFamily: "var(--font-instrument-sans),sans-serif", fontSize: 11, color: "#8A867C" }}>{m.pct}%</span>
            </div>
            <Badge s={m.status} />
            <span style={{ fontFamily: "var(--font-instrument-sans),sans-serif", fontSize: 13, color: "#171717", fontWeight: 600 }}>{m.hLog}h</span>
          </TRow>
        ))}
      </TableWrap>
    </div>
  );
}
