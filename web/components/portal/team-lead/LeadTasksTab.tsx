"use client";

import { useState } from "react";
import { MILESTONES, STATUS_DOT, TEAM } from "@/lib/portal/data";
import { addAssignedTask, addNotif, readAssignedTasks, writeAssignedTasks, type AssignedTask } from "@/lib/portal/storage";
import { fmtMDate } from "@/lib/portal/helpers";
import { cardS, fldS, labS, secSub, secTitle } from "@/lib/portal/style-tokens";
import { Badge, Priority } from "../ui/Badge";
import { Btn } from "../ui/Btn";
import { DatePicker } from "../ui/DatePicker";
import { TableWrap, THead, TRow } from "../ui/Table";

export function LeadTasksTab() {
  const team = TEAM;
  const [emp, setEmp] = useState(team[0] ? team[0].name : "");
  const [task, setTask] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [ms, setMs] = useState("");
  const [tasks, setTasks] = useState<AssignedTask[]>(() => readAssignedTasks());
  const [msg, setMsg] = useState("");

  const refresh = () => setTasks(readAssignedTasks());

  const create = () => {
    if (!task.trim() || !emp) {
      setMsg("⚠ Pick an employee and enter a task.");
      return;
    }
    const dueLabel = due ? fmtMDate(due) : "TBD";
    const t: AssignedTask = {
      id: "LT" + String(Date.now()).slice(-6),
      task: task.trim(),
      assignedTo: emp,
      by: "Pranav R.",
      assignedRole: "employee",
      del: "Task",
      lod: "—",
      phase: "CD",
      status: "Not Started",
      pct: 0,
      due: dueLabel,
      delay: null,
      priority,
      milestone: ms || "",
      project: "Dubai Marina Tower",
    };
    addAssignedTask(t);
    addNotif({
      role: "employee",
      title: "New task assigned by Team Lead",
      body: "Pranav R. assigned: " + t.task + (due ? " — due " + dueLabel : "") + " (" + priority + " priority)." + (ms ? " Linked to milestone: " + ms + "." : ""),
      tab: "My Tasks",
    });
    refresh();
    setMsg('✓ "' + t.task + '" assigned to ' + emp + ".");
    setTask("");
    setDue("");
    setMs("");
  };

  const removeTask = (id: string) => {
    const next = readAssignedTasks().filter((t) => t.id !== id);
    writeAssignedTasks(next);
    setTasks(next);
  };

  const teamNames = team.map((m) => m.name);
  const leadTasks = tasks.filter((t) => t.by === "Pranav R." || teamNames.includes(t.assignedTo as string));
  const counts = leadTasks.reduce((a: Record<string, number>, t) => {
    const s = t.status as string;
    a[s] = (a[s] || 0) + 1;
    return a;
  }, {});
  const tpl = "1.9fr 1.1fr 1.2fr 80px 100px 110px 64px";

  return (
    <div>
      <div style={cardS}>
        <div style={secTitle}>Assign a task to your team</div>
        <div style={secSub}>
          Create and assign work to an employee, set a priority and due date, and optionally link it to a project milestone. The employee is notified in their My Tasks workspace.
        </div>
        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={labS}>Task</span>
          <input style={fldS} value={task} onChange={(e) => setTask(e.target.value)} placeholder="e.g. Coordinate MEP — Level 9" />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 0.9fr", gap: 12, marginBottom: 12 }}>
          <label>
            <span style={labS}>Assign to</span>
            <select style={fldS} value={emp} onChange={(e) => setEmp(e.target.value)}>
              {team.map((m) => (
                <option key={m.id}>{m.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span style={labS}>Due date</span>
            <DatePicker value={due} onChange={(e) => setDue(e.target.value)} style={{ width: "100%" }} placeholder="Pick due date" />
          </label>
          <label>
            <span style={labS}>Priority</span>
            <select style={fldS} value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </label>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "end" }}>
          <label>
            <span style={labS}>
              Link to milestone <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>(optional)</span>
            </span>
            <select style={fldS} value={ms} onChange={(e) => setMs(e.target.value)}>
              <option value="">— No milestone —</option>
              {MILESTONES.map((m) => (
                <option key={m.label} value={m.label}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <Btn v="p" onClick={create} xs={{ height: 38, whiteSpace: "nowrap" }}>
            + Assign task
          </Btn>
        </div>
        {msg && <div style={{ marginTop: 13, fontSize: 12.5, fontWeight: 500, color: msg[0] === "⚠" ? "var(--red)" : "var(--green)" }}>{msg}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, margin: "0 0 12px", flexWrap: "wrap" }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>
          Team tasks <span style={{ color: "#8A867C", fontWeight: 400 }}>· {leadTasks.length}</span>
        </div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {Object.keys(counts).map((s) => (
            <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #E5E2DA", borderRadius: 20, padding: "4px 11px", fontSize: 11.5, fontWeight: 600, color: "#5C594F" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_DOT[s] || "#8A867C" }} />
              {counts[s]} {s}
            </span>
          ))}
        </div>
      </div>
      {leadTasks.length === 0 ? (
        <div style={{ background: "#fff", border: "1px dashed #E5E2DA", borderRadius: 12, padding: "34px", textAlign: "center", color: "#8A867C", fontSize: 13 }}>
          No tasks assigned to your team yet — assign one above to start tracking.
        </div>
      ) : (
        <TableWrap>
          <THead cols={["Task", "Assignee", "Milestone", "Priority", "Due", "Status", ""]} tpl={tpl} />
          {leadTasks.map((t) => (
            <TRow key={t.id} tpl={tpl}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{t.task as string}</span>
              <span style={{ fontSize: 12, color: "#5C594F" }}>{t.assignedTo as string}</span>
              <span style={{ fontSize: 12, color: t.milestone ? "#171717" : "#8A867C" }}>{t.milestone ? "🎯 " + (t.milestone as string) : "—"}</span>
              <Priority p={(t.priority as string) || "Medium"} />
              <span style={{ fontSize: 12, color: "#5C594F" }}>{t.due as string}</span>
              <Badge s={t.status as string} />
              <button
                className="btn-d"
                onClick={() => removeTask(t.id)}
                title="Remove task"
                style={{ background: "#FDECEA", color: "#C0392B", border: "none", borderRadius: 9, padding: "5px 9px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
              >
                ✕
              </button>
            </TRow>
          ))}
        </TableWrap>
      )}
    </div>
  );
}
