"use client";

import { useState } from "react";
import { subPill } from "@/lib/portal/style-tokens";
import { AdminTeamTab } from "./AdminTeamTab";
import { EstimateRequestsTab } from "./EstimateRequestsTab";
import { OpenIssuesTable } from "./OpenIssuesTable";
import { ProjectTaskSection } from "./ProjectTaskSection";

const SUBS = ["Team", "Project Task", "Open Issues", "Estimate Requests"];

export function TeamManagementTab() {
  const [sub, setSub] = useState("Team");
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
        {SUBS.map((s) => (
          <button key={s} onClick={() => setSub(s)} style={subPill(s === sub)}>
            {s}
          </button>
        ))}
      </div>
      {sub === "Team" && <AdminTeamTab />}
      {sub === "Project Task" && <ProjectTaskSection />}
      {sub === "Open Issues" && <OpenIssuesTable />}
      {sub === "Estimate Requests" && <EstimateRequestsTab />}
    </div>
  );
}
