"use client";

import { useEffect, useState } from "react";
import { PEOPLE_KEY, readPeople, writePeople, type Person } from "@/lib/portal/storage";
import { cardS, fldS, labS, secSub, secTitle } from "@/lib/portal/style-tokens";
import { Avi } from "../ui/Avi";
import { Btn } from "../ui/Btn";
import { RoleTag } from "../ui/RoleTag";
import { TableWrap, THead, TRow } from "../ui/Table";

/** Team-lead scoped version of AdminPeopleTab — same add/remove capability,
    restricted to the "employee" position since a lead only manages the
    people under them, not other leads/admins/clients. */
export function ManageTeamSection() {
  const [people, setPeople] = useState<Person[]>(readPeople);
  const [nm, setNm] = useState("");
  const [em, setEm] = useState("");
  const [lid, setLid] = useState("");
  const [lpw, setLpw] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === PEOPLE_KEY || !e.key) setPeople(readPeople());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const employees = people.filter((p) => p.position === "employee");

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
      position: "employee",
      loginId,
      pass,
    };
    const next = [...people, np];
    setPeople(next);
    writePeople(next);
    setMsg("✓ " + np.name + " added to your team. Login ID: " + loginId + " · Password: " + pass + ".");
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

  const tpl = "1.2fr 1.6fr 100px 100px 76px";

  return (
    <div style={{ marginBottom: 30 }}>
      <div style={{ ...cardS, marginBottom: 20 }}>
        <div style={secTitle}>Add a team member</div>
        <div style={secSub}>Create an account for someone joining your team and set their login credentials.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1.6fr", gap: 12 }}>
            <label>
              <span style={labS}>Full name</span>
              <input style={fldS} value={nm} onChange={(e) => setNm(e.target.value)} placeholder="e.g. Noor Khan" />
            </label>
            <label>
              <span style={labS}>Email</span>
              <input style={fldS} value={em} onChange={(e) => setEm(e.target.value)} placeholder="noor@ecobim.com" />
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1.6fr auto", gap: 12, alignItems: "end" }}>
            <label>
              <span style={labS}>Login ID</span>
              <input style={fldS} value={lid} onChange={(e) => setLid(e.target.value)} placeholder="defaults to first name" />
            </label>
            <label>
              <span style={labS}>Password</span>
              <input style={fldS} value={lpw} onChange={(e) => setLpw(e.target.value)} placeholder="defaults to ecobim@1" />
            </label>
            <Btn v="p" onClick={addP} xs={{ height: 38, whiteSpace: "nowrap" }}>
              + Add member
            </Btn>
          </div>
        </div>
        {msg && (
          <div style={{ marginTop: 13, fontSize: 12.5, fontWeight: 500, color: msg[0] === "⚠" ? "var(--red)" : "var(--green)" }}>{msg}</div>
        )}
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, margin: "0 0 12px" }}>
        Team roster <span style={{ color: "#8A867C", fontWeight: 400 }}>· {employees.length}</span>
      </div>
      <TableWrap>
        <THead cols={["Name", "Email", "Login ID", "Password", ""]} tpl={tpl} />
        {employees.map((p) => (
          <TRow key={p.id} tpl={tpl}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avi ini={p.ini} size={26} />
              <span style={{ fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
                {p.name} <RoleTag role="employee" />
              </span>
            </div>
            <span style={{ fontSize: 12, color: "#5C594F", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.email}</span>
            <span style={{ fontSize: 12, color: "#5C594F", fontFamily: "monospace" }}>{p.loginId || "—"}</span>
            <span style={{ fontSize: 12, color: "#5C594F", fontFamily: "monospace" }}>{p.pass || "—"}</span>
            <Btn v="d" onClick={() => rm(p.id)} xs={{ fontSize: 11.5, padding: "5px 10px" }}>
              Remove
            </Btn>
          </TRow>
        ))}
      </TableWrap>
    </div>
  );
}
