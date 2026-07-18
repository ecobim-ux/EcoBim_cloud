"use client";

import { useEffect, useState } from "react";
import {
  PEOPLE_KEY,
  POS_LABEL,
  POS_ORDER,
  readPeople,
  readReach,
  writePeople,
  writeReach,
  type Person,
} from "@/lib/portal/storage";
import { cardS, fldS, labS, secSub, secTitle } from "@/lib/portal/style-tokens";
import { Avi } from "../ui/Avi";
import { Btn } from "../ui/Btn";
import { RoleTag } from "../ui/RoleTag";
import { TableWrap, THead, TRow } from "../ui/Table";
import { PhasePill } from "../ui/icons";

export function AdminPeopleTab() {
  const [people, setPeople] = useState<Person[]>(readPeople);
  const [reach, setReach] = useState<Record<string, string[]>>(readReach);
  const [nm, setNm] = useState("");
  const [em, setEm] = useState("");
  const [pos, setPos] = useState("employee");
  const [lid, setLid] = useState("");
  const [lpw, setLpw] = useState("");
  const [msg, setMsg] = useState("");

  /* live-refresh when localStorage changes from another tab or component */
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === PEOPLE_KEY || !e.key) setPeople(readPeople());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const initials = (name: string) => {
    const w = name.trim().split(/\s+/);
    return (((w[0] || "")[0] || "") + ((w[1] || "")[0] || (w[0] || "")[1] || "")).toUpperCase() || "?";
  };

  const addP = () => {
    if (!nm.trim() || !em.trim()) {
      setMsg("⚠ Enter both a name and an email address.");
      return;
    }
    const loginId = lid.trim() || nm.trim().split(/\s+/)[0].toLowerCase();
    const pass = lpw.trim() || "ecobim@1";
    const np: Person = {
      id: "u-" + Date.now(),
      name: nm.trim(),
      email: em.trim(),
      ini: initials(nm),
      position: pos,
      loginId,
      pass,
    };
    const next = [...people, np];
    setPeople(next);
    writePeople(next);
    setMsg("✓ " + np.name + " added as " + POS_LABEL[pos] + ". Login ID: " + loginId + " · Password: " + pass + ".");
    setNm("");
    setEm("");
    setLid("");
    setLpw("");
  };

  const rm = (id: string) => {
    const next = people.filter((p) => p.id !== id);
    setPeople(next);
    writePeople(next);
  };

  const toggleReach = (from: string, to: string) => {
    const cur = reach[from] || [];
    const nx = { ...reach, [from]: cur.includes(to) ? cur.filter((x) => x !== to) : [...cur, to] };
    setReach(nx);
    writeReach(nx);
  };

  const tpl = "1.1fr 1.4fr 90px 90px 90px 1fr 76px";
  const matrixCols = "180px repeat(" + POS_ORDER.length + ",1fr)";

  return (
    <div>
      <div style={{ ...cardS, marginBottom: 26 }}>
        <div style={secTitle}>Add a person</div>
        <div style={secSub}>
          Create an account, assign a position, and set a login ID + password so they can sign in. Reach-out permissions follow from the position — fine-tune them in the rules grid below.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1.6fr 1fr", gap: 12 }}>
            <label>
              <span style={labS}>Full name</span>
              <input style={fldS} value={nm} onChange={(e) => setNm(e.target.value)} placeholder="e.g. Noor Khan" />
            </label>
            <label>
              <span style={labS}>Email</span>
              <input style={fldS} value={em} onChange={(e) => setEm(e.target.value)} placeholder="noor@ecobim.com" />
            </label>
            <label>
              <span style={labS}>Position</span>
              <select style={fldS} value={pos} onChange={(e) => setPos(e.target.value)}>
                {POS_ORDER.map((p) => (
                  <option key={p} value={p}>
                    {POS_LABEL[p]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1.6fr 1fr auto", gap: 12, alignItems: "end" }}>
            <label>
              <span style={labS}>Login ID</span>
              <input style={fldS} value={lid} onChange={(e) => setLid(e.target.value)} placeholder="defaults to first name" />
            </label>
            <label>
              <span style={labS}>Password</span>
              <input style={fldS} value={lpw} onChange={(e) => setLpw(e.target.value)} placeholder="defaults to ecobim@1" />
            </label>
            <div />
            <Btn v="p" onClick={addP} xs={{ height: 38, whiteSpace: "nowrap" }}>
              + Add person
            </Btn>
          </div>
        </div>
        {msg && (
          <div style={{ marginTop: 13, fontSize: 12.5, fontWeight: 500, color: msg[0] === "⚠" ? "var(--red)" : "var(--green)" }}>{msg}</div>
        )}
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, margin: "0 0 12px" }}>
        People directory <span style={{ color: "#8A867C", fontWeight: 400 }}>· {people.length}</span>
      </div>
      <TableWrap>
        <THead cols={["Name", "Email", "Role", "Login ID", "Password", "Can invite", ""]} tpl={tpl} />
        {people.map((p) => (
          <TRow key={p.id} tpl={tpl}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avi ini={p.ini} size={26} />
              <span style={{ fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
                {p.name} <RoleTag role={p.position} />
              </span>
            </div>
            <span style={{ fontSize: 12, color: "#5C594F", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.email}</span>
            <span>
              <PhasePill p={POS_LABEL[p.position] || p.position} />
            </span>
            <span style={{ fontSize: 12, color: "#5C594F", fontFamily: "monospace" }}>{p.loginId || "—"}</span>
            <span style={{ fontSize: 12, color: "#5C594F", fontFamily: "monospace" }}>{p.pass || "—"}</span>
            <span style={{ fontSize: 12, color: "#5C594F" }}>{(reach[p.position] || []).map((r) => POS_LABEL[r]).join(", ") || "—"}</span>
            <Btn v="d" onClick={() => rm(p.id)} xs={{ fontSize: 11.5, padding: "5px 10px" }}>
              Remove
            </Btn>
          </TRow>
        ))}
      </TableWrap>
      <div style={{ fontSize: 15, fontWeight: 600, margin: "28px 0 6px" }}>Reach-out rules</div>
      <div style={{ fontSize: 12.5, color: "#8A867C", marginBottom: 14, maxWidth: 640 }}>
        Tick who each position is allowed to invite to a meeting. Changes apply instantly to the scheduler for everyone in that role.
      </div>
      <div style={{ background: "#fff", border: "1px solid #E5E2DA", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: matrixCols, background: "#F6F4EF", borderBottom: "1px solid #E5E2DA", padding: "12px 18px", fontSize: 10.5, fontWeight: 700, color: "#8A867C", textTransform: "uppercase", letterSpacing: "0.06em", alignItems: "center" }}>
          <span>Role · can invite ↓</span>
          {POS_ORDER.map((p) => (
            <span key={p} style={{ textAlign: "center" }}>
              {POS_LABEL[p]}
            </span>
          ))}
        </div>
        {POS_ORDER.map((from) => (
          <div key={from} style={{ display: "grid", gridTemplateColumns: matrixCols, padding: "13px 18px", borderBottom: "1px solid #F2F0EA", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{POS_LABEL[from]}</span>
            {POS_ORDER.map((to) => {
              const on = (reach[from] || []).includes(to);
              return (
                <div key={to} style={{ textAlign: "center" }}>
                  <button
                    onClick={() => toggleReach(from, to)}
                    title={POS_LABEL[from] + " can invite " + POS_LABEL[to]}
                    style={{ width: 24, height: 24, borderRadius: 7, border: on ? "none" : "1.5px solid #D8D5CD", background: on ? "#171717" : "#fff", color: "#fff", cursor: "pointer", fontSize: 13, lineHeight: 1, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                  >
                    {on ? "✓" : ""}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
