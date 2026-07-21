"use client";

import { useEffect, useState } from "react";
import type { ApiTask } from "@/app/api/tasks/route";
import type { ApiTeamMember } from "@/lib/portal/team";
import { computeProductivityFromTasks } from "@/lib/portal/productivity";
import { fetchTasks } from "@/lib/portal/tasks";
import { Avi } from "../ui/Avi";
import { ProductivityView } from "../ui/ProductivityView";
import { useModalA11y } from "../ui/useModalA11y";

export function EmployeeProductivityModal({ member, onClose }: { member: ApiTeamMember; onClose: () => void }) {
  const [tasks, setTasks] = useState<ApiTask[] | null>(null);
  useEffect(() => {
    fetchTasks().then((all) => setTasks(all.filter((t) => t.assignedTo === member.name)));
  }, [member.name]);
  const dialogRef = useModalA11y(onClose);

  const overlay = {
    position: "fixed" as const,
    inset: 0,
    zIndex: 300,
    background: "rgba(23,23,23,.5)",
    backdropFilter: "blur(3px)",
    WebkitBackdropFilter: "blur(3px)",
    display: "flex" as const,
    alignItems: "flex-start" as const,
    justifyContent: "center" as const,
    padding: "40px 16px",
    overflowY: "auto" as const,
  };
  const card = {
    background: "#FAF9F6",
    width: "100%",
    maxWidth: 620,
    borderRadius: 16,
    boxShadow: "0 30px 80px rgba(0,0,0,.32)",
    overflow: "hidden",
    margin: "auto",
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div ref={dialogRef} tabIndex={-1} style={card} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={member.name + " productivity"}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "18px 22px", borderBottom: "1px solid #E5E2DA", background: "#fff" }}>
          <Avi ini={member.initials} size={32} role="employee" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{member.name}</div>
            <div style={{ fontSize: 12, color: "#8A867C" }}>{member.role || "Employee"} · Productivity</div>
          </div>
          <button className="meet-x" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: "none", background: "none", color: "#8A867C", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>
            ×
          </button>
        </div>
        <div style={{ padding: "20px 22px" }}>
          {tasks === null ? (
            <div style={{ fontSize: 13, color: "#8A867C", textAlign: "center", padding: "20px 0" }}>Loading…</div>
          ) : (
            <ProductivityView data={computeProductivityFromTasks(tasks)} />
          )}
        </div>
      </div>
    </div>
  );
}
