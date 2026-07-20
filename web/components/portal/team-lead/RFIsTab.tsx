"use client";

import { useCallback, useEffect, useState } from "react";
import { assignRfi, fetchRfis, respondToRfi, type ApiRfi } from "@/lib/portal/rfis";
import { usePeople } from "../PeopleProvider";
import { Badge, Priority } from "../ui/Badge";
import { Btn } from "../ui/Btn";
import { TableWrap, THead, TRow } from "../ui/Table";
import { notify } from "../ui/Toast";

export function RFIsTab({ extraCol }: { extraCol?: boolean }) {
  const [rfis, setRfis] = useState<ApiRfi[]>([]);
  const [assigned, setAssigned] = useState<Record<string, string>>({});
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [respText, setRespText] = useState("");
  const { people } = usePeople();
  const employees = people.filter((p) => p.position === "employee");
  const tpl = extraCol ? "110px 2fr 120px 110px 80px 150px 100px" : "110px 2fr 120px 110px 80px";
  const cols = extraCol
    ? ["RFI ID", "Title", "Status", "Raised", "Priority", "Assign To", "Action"]
    : ["RFI ID", "Title", "Status", "Raised", "Priority"];

  const load = useCallback(() => {
    fetchRfis().then(setRfis);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const doAssign = async (id: string, loginId: string) => {
    if (!loginId) return;
    const result = await assignRfi(id, loginId);
    if (!result.ok) {
      notify(result.error || "Couldn't assign that RFI.", "error");
      return;
    }
    notify("RFI assigned", "success");
    load();
  };

  const send = async (id: string) => {
    if (!respText.trim()) return;
    const result = await respondToRfi(id, respText.trim());
    if (!result.ok) {
      notify(result.error || "Couldn't send that response.", "error");
      return;
    }
    notify("Response sent", "success");
    setRespondingId(null);
    setRespText("");
    load();
  };

  return (
    <TableWrap>
      <THead cols={cols} tpl={tpl} />
      {rfis.map((r) => (
        <TRow key={r.id} tpl={tpl}>
          <span style={{ fontFamily: "var(--font-instrument-sans),sans-serif", fontSize: 12, fontWeight: 600, color: "#171717" }}>{r.code}</span>
          <span style={{ fontSize: 14 }}>{r.title}</span>
          <Badge s={r.status} />
          <span style={{ fontFamily: "var(--font-instrument-sans),sans-serif", fontSize: 12, color: "#5C594F" }}>{r.raised}</span>
          <Priority p={r.priority} />
          {extraCol && (
            <select
              value={assigned[r.id] ?? ""}
              onChange={(e) => {
                setAssigned((p) => ({ ...p, [r.id]: e.target.value }));
                doAssign(r.id, e.target.value);
              }}
              style={{ padding: "5px 8px", border: "1px solid #E5E2DA", borderRadius: 12, fontSize: 12, background: "#F6F4EF", color: "#171717" }}
            >
              <option value="">{r.assigneeName || "—"}</option>
              {employees.map((p) => (
                <option key={p.partyId} value={p.loginId}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          {extraCol &&
            (respondingId === r.id ? (
              <div style={{ display: "flex", gap: 6, gridColumn: "span 1" }}>
                <input
                  autoFocus
                  value={respText}
                  onChange={(e) => setRespText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send(r.id)}
                  placeholder="Response…"
                  style={{ width: 90, padding: "5px 8px", border: "1px solid #171717", borderRadius: 10, fontSize: 12 }}
                />
                <Btn v="p" xs={{ padding: "5px 10px", fontSize: 11 }} onClick={() => send(r.id)}>
                  Send
                </Btn>
              </div>
            ) : (
              <Btn v="s" xs={{ padding: "5px 12px", fontSize: 12 }} onClick={() => setRespondingId(r.id)}>
                Respond
              </Btn>
            ))}
        </TRow>
      ))}
    </TableWrap>
  );
}
