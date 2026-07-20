"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchIssues, respondToIssue, type ApiIssue } from "@/lib/portal/issues";
import { fetchRfis, respondToRfi, type ApiRfi } from "@/lib/portal/rfis";
import { usePeople } from "../PeopleProvider";
import { sendNotification } from "@/lib/portal/notifications";
import { Badge } from "../ui/Badge";
import { Btn } from "../ui/Btn";
import { notify } from "../ui/Toast";

const PRI_RANK: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
const PRI_COL: Record<string, string> = { High: "#C0392B", Medium: "#B8860B", Low: "#8A867C" };

export function EmployeeRFIsTab() {
  const { people } = usePeople();
  const [issues, setIssues] = useState<ApiIssue[]>([]);
  const [rfis, setRfis] = useState<ApiRfi[]>([]);
  const [resp, setResp] = useState<Record<string, string>>({});
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [flash, setFlash] = useState("");

  const load = useCallback(() => {
    fetchIssues().then(setIssues);
    fetchRfis().then(setRfis);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const raised = issues.map((i) => ({
    id: i.id,
    code: i.code,
    title: i.title,
    priority: i.sev || "Medium",
    status: i.resolved ? "Closed" : i.status,
    from: i.by,
    date: i.date,
    kind: "Issue" as const,
  }));
  const rfiItems = rfis.map((r) => ({
    id: r.id,
    code: r.code,
    title: r.title,
    priority: r.priority,
    status: r.status,
    from: "BIM Team",
    date: r.raised,
    kind: "RFI" as const,
  }));
  const items = [...raised, ...rfiItems].sort((a, b) => (PRI_RANK[a.priority] ?? 1) - (PRI_RANK[b.priority] ?? 1));

  const send = async (it: (typeof items)[number]) => {
    const r = (resp[it.id] || "").trim();
    if (!r) return;
    const result = it.kind === "Issue" ? await respondToIssue(it.id, r) : await respondToRfi(it.id, r);
    if (!result.ok) {
      notify(result.error || "Couldn't send that response.", "error");
      return;
    }
    setResp((p) => ({ ...p, [it.id]: "" }));
    setOpenFor(null);
    sendNotification({
      recipientLoginIds: [people.find((p) => p.position === "teamlead")?.loginId],
      title: it.kind === "Issue" ? "Issue response submitted" : "RFI response submitted",
      body: "Arjun Mehta responded to " + it.code + ": " + r,
      tab: "RFIs",
    });
    setFlash("✓ Response sent for " + it.code);
    notify("Response sent", "success");
    setTimeout(() => setFlash(""), 1800);
    load();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600 }}>
            RFIs &amp; Issues <span style={{ color: "#8A867C", fontWeight: 400 }}>· {items.length}</span>
          </h3>
          <p style={{ fontSize: 12.5, color: "#8A867C", marginTop: 2 }}>
            From Admin and Team Leads — sorted by priority. Respond to update the status.
          </p>
        </div>
        {flash && <span style={{ fontSize: 12.5, color: "#1A7A4A", fontWeight: 600 }}>{flash}</span>}
      </div>
      {items.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px dashed #E5E2DA", padding: "40px", textAlign: "center", color: "#8A867C", fontSize: 14 }}>
          Nothing assigned to you.
        </div>
      ) : (
        items.map((it) => {
          const locked = it.status === "Closed";
          return (
            <div key={it.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E2DA", borderLeft: "3px solid " + (PRI_COL[it.priority] || "#8A867C"), padding: "16px 20px", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "var(--font-instrument-sans),sans-serif", fontSize: 12, fontWeight: 600 }}>{it.code}</span>
                  <span style={{ background: "#F2F0EA", color: "#5C594F", fontSize: 10.5, fontWeight: 600, padding: "2px 8px", borderRadius: 12 }}>{it.kind}</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{it.title}</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: PRI_COL[it.priority] || "#8A867C" }}>{it.priority}</span>
                  <Badge s={it.status} />
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#8A867C", marginBottom: 12 }}>
                From {it.from} · {it.date}
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                {locked ? (
                  <span style={{ fontSize: 12, color: "#1A7A4A", fontWeight: 600 }}>✓ Closed</span>
                ) : (
                  <Btn v="s" xs={{ fontSize: 12, padding: "6px 13px" }} onClick={() => setOpenFor((f) => (f === it.id ? null : it.id))}>
                    Respond
                  </Btn>
                )}
              </div>
              {openFor === it.id && !locked && (
                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  <input
                    value={resp[it.id] || ""}
                    onChange={(e) => setResp((p) => ({ ...p, [it.id]: e.target.value }))}
                    autoFocus={true}
                    placeholder="Type your response…"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") send(it);
                    }}
                    style={{ flex: 1, padding: "8px 12px", border: "1px solid #171717", borderRadius: 12, fontSize: 13, background: "#fff" }}
                  />
                  <Btn v="p" xs={{ fontSize: 12, padding: "8px 14px" }} onClick={() => send(it)}>
                    Send
                  </Btn>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
