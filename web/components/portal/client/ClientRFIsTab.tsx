import { RFIS } from "@/lib/portal/data";
import { Badge } from "../ui/Badge";
import { TableWrap, THead, TRow } from "../ui/Table";

export function ClientRFIsTab() {
  const tpl = "110px 2fr 120px 120px 150px";
  const clientRFIs = RFIS.filter((r) => ["RFI-014", "RFI-011"].includes(r.id));
  return (
    <TableWrap>
      <THead cols={["RFI ID", "Subject", "Status", "Raised", "Response"]} tpl={tpl} />
      {clientRFIs.map((r) => (
        <TRow key={r.id} tpl={tpl}>
          <span style={{ fontFamily: "var(--font-instrument-sans),sans-serif", fontSize: 12, fontWeight: 600, color: "#171717" }}>{r.id}</span>
          <span style={{ fontSize: 14 }}>{r.title}</span>
          <Badge s={r.status} />
          <span style={{ fontFamily: "var(--font-instrument-sans),sans-serif", fontSize: 12, color: "#8A867C" }}>{r.raised}</span>
          {r.status === "Pending" ? (
            <span style={{ fontSize: 12, color: "#B7770D", fontWeight: 500 }}>Response Due</span>
          ) : (
            <span style={{ fontSize: 12, color: "#1A7A4A", fontWeight: 500 }}>✓ Responded</span>
          )}
        </TRow>
      ))}
    </TableWrap>
  );
}
