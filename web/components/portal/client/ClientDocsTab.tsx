import { DOCS } from "@/lib/portal/data";
import { Btn } from "../ui/Btn";
import { TableWrap, THead, TRow } from "../ui/Table";

export function ClientDocsTab() {
  return (
    <TableWrap>
      <THead cols={["", "File Name", "Type", "Uploaded", "Action"]} tpl="40px 2.5fr 120px 130px 110px" />
      {DOCS.map((d, i) => (
        <TRow key={i} tpl="40px 2.5fr 120px 130px 110px">
          <span style={{ fontSize: 18, color: "#171717" }}>{d.icon}</span>
          <span style={{ fontSize: 14 }}>{d.name}</span>
          <span style={{ background: "#F2F0EA", borderRadius: 12, padding: "3px 8px", fontSize: 11, color: "#5C594F" }}>{d.type}</span>
          <span style={{ fontFamily: "var(--font-instrument-sans),sans-serif", fontSize: 12, color: "#8A867C" }}>{d.date}</span>
          <Btn v="g" xs={{ border: "1px solid #E5E2DA", fontSize: 12 }}>
            ↓ Download
          </Btn>
        </TRow>
      ))}
    </TableWrap>
  );
}
