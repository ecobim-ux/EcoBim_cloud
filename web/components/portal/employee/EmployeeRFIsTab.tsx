"use client";

import { useState } from "react";
import { RFIS } from "@/lib/portal/data";
import { addNotif, readRaisedIssues } from "@/lib/portal/storage";
import { Badge } from "../ui/Badge";
import { Btn } from "../ui/Btn";
import { notify } from "../ui/Toast";

const ERFI_KEY = "bimco_emp_rfi_state";

function readERFI(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(ERFI_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeERFI(o: Record<string, string>) {
  try {
    localStorage.setItem(ERFI_KEY, JSON.stringify(o));
  } catch {
    /* noop */
  }
}

const EMP_RFI_STATUSES = ["Pending", "In Progress", "Responded"];
const PRI_RANK: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
const PRI_COL: Record<string, string> = { High: "#C0392B", Medium: "#B8860B", Low: "#8A867C" };

export function EmployeeRFIsTab() {
  const [state, setState] = useState(readERFI);
  const [resp, setResp] = useState<Record<string, string>>({});
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [flash, setFlash] = useState("");

  const raised = readRaisedIssues().map((i) => ({
    id: i.id,
    title: i.title,
    priority: i.sev || "Medium",
    baseStatus: i.status,
    from: i.by,
    date: i.date,
    kind: "Issue",
  }));
  const rfis = RFIS.map((r) => ({
    id: r.id,
    title: r.title,
    priority: r.priority,
    baseStatus: r.status,
    from: "BIM Team",
    date: r.raised,
    kind: "RFI",
  }));
  const items = [...raised, ...rfis]
    .map((it) => ({ ...it, status: state[it.id] || it.baseStatus }))
    .sort((a, b) => (PRI_RANK[a.priority] ?? 1) - (PRI_RANK[b.priority] ?? 1));

  const setStatus = (id: string, s: string) => {
    const n = { ...state, [id]: s };
    setState(n);
    writeERFI(n);
  };

  const send = (id: string) => {
    const r = (resp[id] || "").trim();
    if (!r) return;
    setStatus(id, "Responded");
    setResp((p) => ({ ...p, [id]: "" }));
    setOpenFor(null);
    addNotif({ role: "teamlead", title: "RFI response submitted", body: "Arjun Mehta responded to " + id + ": " + r, tab: "RFIs" });
    setFlash("✓ Response sent for " + id);
    notify("RFI response sent", "success");
    setTimeout(() => setFlash(""), 1800);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600 }}>
            RFIs &amp; Issues <span style={{ color: "#8A867C", fontWeight: 400 }}>· {items.length}</span>
          </h3>
          <p style={{ fontSize: 12.5, color: "#8A867C", marginTop: 2 }}>
            From Admin and Team Leads — sorted by priority. Respond and update your status.
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
          const locked = it.baseStatus === "Closed";
          return (
            <div key={it.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E2DA", borderLeft: "3px solid " + (PRI_COL[it.priority] || "#8A867C"), padding: "16px 20px", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "var(--font-instrument-sans),sans-serif", fontSize: 12, fontWeight: 600 }}>{it.id}</span>
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
                <label style={{ fontSize: 12, color: "#5C594F", display: "inline-flex", alignItems: "center", gap: 7 }}>
                  Status
                  <select
                    value={EMP_RFI_STATUSES.includes(it.status) ? it.status : EMP_RFI_STATUSES[0]}
                    disabled={locked}
                    onChange={(e) => setStatus(it.id, e.target.value)}
                    style={{ padding: "6px 10px", border: "1px solid #E5E2DA", borderRadius: 10, fontSize: 12, background: locked ? "#F2F0EA" : "#F6F4EF", color: "#171717" }}
                  >
                    {EMP_RFI_STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
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
                      if (e.key === "Enter") send(it.id);
                    }}
                    style={{ flex: 1, padding: "8px 12px", border: "1px solid #171717", borderRadius: 12, fontSize: 13, background: "#fff" }}
                  />
                  <Btn v="p" xs={{ fontSize: 12, padding: "8px 14px" }} onClick={() => send(it.id)}>
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
