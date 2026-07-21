"use client";

import { useState } from "react";
import { subPill } from "@/lib/portal/style-tokens";
import { AdminPeopleTab } from "./AdminPeopleTab";
import { CreateClientSection } from "./CreateClientSection";

const SUBS = ["People & Roles", "Create New Freelance"];

export function ManagementTab() {
  const [sub, setSub] = useState("People & Roles");
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
        {SUBS.map((s) => (
          <button key={s} onClick={() => setSub(s)} style={subPill(s === sub)}>
            {s}
          </button>
        ))}
      </div>
      {sub === "People & Roles" && <AdminPeopleTab />}
      {sub === "Create New Freelance" && <CreateClientSection />}
    </div>
  );
}
