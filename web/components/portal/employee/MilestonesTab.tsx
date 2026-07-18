"use client";

import { useState } from "react";
import { MILESTONES, MY_TASKS, PROJECTS, type MyTask } from "@/lib/portal/data";
import { readAssignedTasks } from "@/lib/portal/storage";
import { subPill } from "@/lib/portal/style-tokens";
import { Badge } from "../ui/Badge";
import { PBar } from "../ui/PBar";
import { PhasePill } from "../ui/icons";

const ETASK_KEY = "bimco_emp_task_state";

function readETask(): Record<string, { status?: string }> {
  try {
    return JSON.parse(localStorage.getItem(ETASK_KEY) || "{}");
  } catch {
    return {};
  }
}

function MilestoneTimeline() {
  return (
    <div style={{ paddingLeft: 12 }}>
      {MILESTONES.map((m, i) => {
        const isLast = i === MILESTONES.length - 1;
        return (
          <div key={i} style={{ display: "flex", gap: 16, paddingBottom: isLast ? 0 : 8 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: m.done ? "#1A7A4A" : m.active ? "#171717" : "transparent",
                  border: m.active ? "3px solid #171717" : m.done ? "none" : "2px solid #BDBDBD",
                  boxShadow: m.active ? "0 0 0 4px #F2F0EA" : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {m.done && <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>✓</span>}
              </div>
              {!isLast && <div style={{ width: 2, flex: 1, minHeight: 28, background: m.done ? "#1A7A4A" : "#E5E2DA", margin: "4px 0" }} />}
            </div>
            <div style={{ paddingBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: m.active ? 600 : 400, color: m.done ? "#1A7A4A" : m.active ? "#171717" : "#5C594F" }}>
                {m.label}{" "}
                {m.active && (
                  <span style={{ fontSize: 11, color: "#171717", background: "#F2F0EA", padding: "2px 8px", borderRadius: 12, fontWeight: 600, marginLeft: 4 }}>
                    In progress
                  </span>
                )}
              </div>
              <div style={{ fontFamily: "var(--font-instrument-sans),sans-serif", fontSize: 12, color: "#8A867C", marginTop: 4 }}>{m.date}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MilestonesTab() {
  const [view, setView] = useState("Daily");
  const state = readETask();
  const assigned = readAssignedTasks().filter((t) => t.assignedTo === "Arjun Mehta") as unknown as MyTask[];
  const all = [...MY_TASKS, ...assigned].map((t) => {
    const s = state[t.id as string] || {};
    return {
      ...t,
      status: s.status || (t as { status?: string }).status,
      today: (t as { today?: boolean }).today !== undefined ? (t as { today?: boolean }).today : true,
    };
  });
  const todayTasks = all.filter((t) => t.today);
  const doneCount = todayTasks.filter((t) => t.status === "Completed").length;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
        {["Daily", "Project progress"].map((s) => (
          <button key={s} onClick={() => setView(s)} style={subPill(s === view)}>
            {s}
          </button>
        ))}
      </div>
      {view === "Daily" ? (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4, flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Today&apos;s milestones</div>
            <div style={{ fontSize: 12.5, color: "#8A867C" }}>
              {doneCount}/{todayTasks.length} done today
            </div>
          </div>
          <p style={{ fontSize: 12.5, color: "#8A867C", marginBottom: 16 }}>
            Daily milestones derived from the tasks assigned to you for today.
          </p>
          {todayTasks.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px dashed #E5E2DA", padding: "34px", textAlign: "center", color: "#8A867C", fontSize: 13 }}>
              No tasks scheduled for today.
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E2DA", overflow: "hidden" }}>
              {todayTasks.map((t, i) => {
                const done = t.status === "Completed";
                return (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: i < todayTasks.length - 1 ? "1px solid #F2F0EA" : "none" }}>
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        flexShrink: 0,
                        background: done ? "#1A7A4A" : "transparent",
                        border: done ? "none" : "2px solid #C9C5BC",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {done && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: done ? "#1A7A4A" : "#171717" }}>{t.task}</div>
                      <div style={{ fontSize: 11.5, color: "#8A867C", marginTop: 2 }}>
                        Due {t.due} · {(t as { priority?: string }).priority || "Medium"} priority
                      </div>
                    </div>
                    <Badge s={t.status ?? "Not Started"} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Project progress</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
            {PROJECTS.map((p) => (
              <div key={p.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E2DA", padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
                  <PhasePill p={p.phase} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                  <PBar pct={p.progress} label={p.name} />
                  <span style={{ fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{p.progress}%</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Milestone status — Dubai Marina Tower</div>
          <MilestoneTimeline />
        </div>
      )}
    </div>
  );
}
