"use client";

import { useState } from "react";
import { subPill } from "@/lib/portal/style-tokens";
import { IssuesTab } from "./IssuesTab";
import { RFIsTab } from "./RFIsTab";

const SUBS = ["Issues", "RFIs"];

export function IssuesRfisTab({ userName }: { userName: string }) {
  const [sub, setSub] = useState("Issues");
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
        {SUBS.map((s) => (
          <button key={s} onClick={() => setSub(s)} style={subPill(s === sub)}>
            {s}
          </button>
        ))}
      </div>
      {sub === "Issues" && <IssuesTab userName={userName} />}
      {sub === "RFIs" && <RFIsTab extraCol={true} />}
    </div>
  );
}
