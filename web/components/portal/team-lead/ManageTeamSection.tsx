"use client";

import { useState } from "react";
import { createPerson, deactivatePerson } from "@/lib/portal/people";
import { usePeople } from "../PeopleProvider";
import { cardS, fldS, labS, secSub, secTitle } from "@/lib/portal/style-tokens";
import { Avi } from "../ui/Avi";
import { Btn } from "../ui/Btn";
import { RoleTag } from "../ui/RoleTag";
import { TableWrap, THead, TRow } from "../ui/Table";

/** Team-lead scoped version of AdminPeopleTab — same add/remove capability,
    restricted to the "employee" position since a lead only manages the
    people under them, not other leads/admins/clients (also enforced
    server-side in the /api/people routes). */
export function ManageTeamSection() {
  const { people: allPeople, refetch } = usePeople();
  const people = allPeople.filter((p) => p.position === "employee");
  const [nm, setNm] = useState("");
  const [em, setEm] = useState("");
  const [lid, setLid] = useState("");
  const [lpw, setLpw] = useState("");
  const [msg, setMsg] = useState("");

  const addP = async () => {
    if (!nm.trim() || !em.trim()) {
      setMsg("⚠ Enter both a name and an email address.");
      return;
    }
    const result = await createPerson({ name: nm.trim(), email: em.trim(), position: "employee", loginId: lid.trim() || undefined, password: lpw.trim() || undefined });
    if (!result.ok) {
      setMsg("⚠ " + result.error);
      return;
    }
    setMsg("✓ " + nm.trim() + " added to your team. Login ID: " + result.loginId + " · Password: " + result.password + " — shown once, share it securely.");
    setNm("");
    setEm("");
    setLid("");
    setLpw("");
    refetch();
  };

  const rm = async (partyId: string) => {
    const result = await deactivatePerson(partyId);
    if (!result.ok) {
      setMsg("⚠ " + result.error);
      return;
    }
    refetch();
  };

  const tpl = "1.2fr 1.6fr 100px 76px";

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
        Team roster <span style={{ color: "#8A867C", fontWeight: 400 }}>· {people.length}</span>
      </div>
      <TableWrap>
        <THead cols={["Name", "Email", "Login ID", ""]} tpl={tpl} />
        {people.map((p) => (
          <TRow key={p.partyId} tpl={tpl}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avi ini={p.initials} size={26} />
              <span style={{ fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
                {p.name} <RoleTag role="employee" />
              </span>
            </div>
            <span style={{ fontSize: 12, color: "#5C594F", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.email || "—"}</span>
            <span style={{ fontSize: 12, color: "#5C594F", fontFamily: "monospace" }}>{p.loginId || "—"}</span>
            <Btn v="d" onClick={() => rm(p.partyId)} xs={{ fontSize: 11.5, padding: "5px 10px" }}>
              Remove
            </Btn>
          </TRow>
        ))}
      </TableWrap>
    </div>
  );
}
