"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { MILESTONES } from "@/lib/portal/data";
import { usePeople } from "../PeopleProvider";
import { completeTask, createTask, fetchTasks, reassignTask, type ApiTask, type ApiTaskLogEntry } from "@/lib/portal/tasks";
import { sendNotification } from "@/lib/portal/notifications";
import { fmtMDate } from "@/lib/portal/helpers";
import { cardS, fldS, labS, secSub, secTitle } from "@/lib/portal/style-tokens";
import { Badge, Priority } from "../ui/Badge";
import { Btn } from "../ui/Btn";
import { DatePicker } from "../ui/DatePicker";
import { TableWrap, THead, TRow } from "../ui/Table";
import { notify } from "../ui/Toast";

export function TeamTasksSection({ userName }: { userName: string }) {
  const { people } = usePeople();
  const employees = people.filter((p) => p.position === "employee");
  const [emp, setEmp] = useState("");
  const [task, setTask] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [ms, setMs] = useState("");
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({});
  const [logs, setLogs] = useState<Record<string, ApiTaskLogEntry[]>>({});

  const refresh = useCallback(() => {
    fetchTasks().then(setTasks);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!emp && employees.length > 0) setEmp(employees[0].loginId);
  }, [employees, emp]);

  const create = async () => {
    if (busy) return;
    const person = employees.find((p) => p.loginId === emp);
    if (!task.trim() || !person) {
      setMsg("⚠ Pick an employee and enter a task.");
      return;
    }
    const dueLabel = due ? fmtMDate(due) : "TBD";
    setBusy(true);
    try {
      const result = await createTask({
        title: task.trim(),
        assigneeLoginId: person.loginId,
        priority,
        dueOn: due || undefined,
        milestoneLabel: ms || undefined,
      });
      if (!result.ok) {
        setMsg("⚠ " + result.error);
        return;
      }
      sendNotification({
        recipientLoginIds: [person.loginId],
        title: "New task assigned by Team Lead",
        body: userName + " assigned: " + task.trim() + (due ? " — due " + dueLabel : "") + " (" + priority + " priority)." + (ms ? " Linked to milestone: " + ms + "." : ""),
        tab: "My Tasks",
      });
      refresh();
      setMsg('✓ "' + task.trim() + '" assigned to ' + person.name + ".");
      setTask("");
      setDue("");
      setMs("");
    } finally {
      setBusy(false);
    }
  };

  const addLog = (taskId: string, log: ApiTaskLogEntry) => {
    setLogs((p) => ({ ...p, [taskId]: [...(p[taskId] || []), log] }));
  };

  const onComplete = async (t: ApiTask) => {
    if (busyIds[t.id]) return;
    setBusyIds((p) => ({ ...p, [t.id]: true }));
    try {
      const result = await completeTask(t.id);
      if (!result.ok) {
        notify(result.error || "Couldn't complete that task.", "error");
        return;
      }
      if (result.log) addLog(t.id, result.log);
      notify("Task marked complete", "success");
      refresh();
    } finally {
      setBusyIds((p) => ({ ...p, [t.id]: false }));
    }
  };

  const onReassign = async (t: ApiTask, loginId: string) => {
    if (!loginId || busyIds[t.id]) return;
    const person = employees.find((p) => p.loginId === loginId);
    if (!person) return;
    setBusyIds((p) => ({ ...p, [t.id]: true }));
    try {
      const result = await reassignTask(t.id, loginId);
      if (!result.ok) {
        notify(result.error || "Couldn't reassign that task.", "error");
        return;
      }
      sendNotification({
        recipientLoginIds: [loginId],
        title: "Task reassigned to you",
        body: userName + " reassigned: " + t.task,
        tab: "My Tasks",
      });
      if (result.log) addLog(t.id, result.log);
      notify("Task reassigned to " + person.name, "success");
      refresh();
    } finally {
      setBusyIds((p) => ({ ...p, [t.id]: false }));
    }
  };

  const employeeNames = employees.map((p) => p.name);
  const leadTasks = tasks.filter((t) => employeeNames.includes(t.assignedTo));
  const tpl = "96px 1.7fr 1.1fr 1.1fr 90px 90px 130px 56px";

  return (
    <div style={{ marginBottom: 28 }}>
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
              {employees.map((p) => (
                <option key={p.loginId} value={p.loginId}>
                  {p.name}
                </option>
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
          <Btn v="p" onClick={create} disabled={busy} xs={{ height: 38, whiteSpace: "nowrap" }}>
            {busy ? "Assigning…" : "+ Assign task"}
          </Btn>
        </div>
        {msg && <div style={{ marginTop: 13, fontSize: 12.5, fontWeight: 500, color: msg[0] === "⚠" ? "var(--red)" : "var(--green)" }}>{msg}</div>}
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, margin: "0 0 12px" }}>
        Team tasks <span style={{ color: "#8A867C", fontWeight: 400 }}>· {leadTasks.length}</span>
      </div>
      {leadTasks.length === 0 ? (
        <div style={{ background: "#fff", border: "1px dashed #E5E2DA", borderRadius: 12, padding: "34px", textAlign: "center", color: "#8A867C", fontSize: 13 }}>
          No tasks assigned to your team yet — assign one above to start tracking.
        </div>
      ) : (
        <TableWrap>
          <THead cols={["Status", "Task", "Assignee", "Milestone", "Priority", "Due", "Reassign", "Done"]} tpl={tpl} />
          {leadTasks.map((t) => {
            const isDone = t.status === "Completed";
            const taskLogs = logs[t.id] || [];
            return (
              <Fragment key={t.id}>
                <TRow tpl={tpl}>
                  <Badge s={t.status} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{t.task}</span>
                  <span style={{ fontSize: 12, color: "#5C594F" }}>{t.assignedTo}</span>
                  <span style={{ fontSize: 12, color: t.milestone ? "#171717" : "#8A867C" }}>{t.milestone ? "🎯 " + t.milestone : "—"}</span>
                  <Priority p={t.priority || "Medium"} />
                  <span style={{ fontSize: 12, color: "#5C594F" }}>{t.due || "—"}</span>
                  <select
                    value=""
                    disabled={busyIds[t.id] || isDone}
                    onChange={(e) => onReassign(t, e.target.value)}
                    title="Reassign task"
                    style={{ padding: "5px 6px", border: "1px solid #E5E2DA", borderRadius: 9, fontSize: 12, background: "#F6F4EF", color: "#171717", cursor: isDone ? "not-allowed" : "pointer" }}
                  >
                    <option value="">⟳ Reassign</option>
                    {employees.filter((p) => p.name !== t.assignedTo).map((p) => (
                      <option key={p.loginId} value={p.loginId}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => onComplete(t)}
                    disabled={busyIds[t.id] || isDone}
                    title={isDone ? "Already completed" : "Mark complete"}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 9,
                      border: "none",
                      background: isDone ? "#E9F6EE" : "#171717",
                      color: isDone ? "#1A7A4A" : "#fff",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: busyIds[t.id] || isDone ? "not-allowed" : "pointer",
                    }}
                  >
                    ✓
                  </button>
                </TRow>
                {taskLogs.length > 0 && (
                  <div style={{ padding: "8px 20px 12px", borderBottom: "1px solid #F2F0EA", background: "#FAF9F6", display: "flex", flexDirection: "column", gap: 4 }}>
                    {taskLogs.map((l, i) => (
                      <div key={i} style={{ fontSize: 11.5, color: "#5C594F", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: "#1A7A4A" }}>✓</span>
                        {l.label}
                        <span style={{ color: "#8A867C" }}>— {new Date(l.date).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Fragment>
            );
          })}
        </TableWrap>
      )}
    </div>
  );
}
