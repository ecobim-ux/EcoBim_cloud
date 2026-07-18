"use client";

import { useState } from "react";
import { PROJECTS, STATUS_DOT } from "@/lib/portal/data";
import { addAssignedTask, addMeeting, addNotif, POS_LABEL, readAssignedTasks, readPeople, type AssignedTask, type Person } from "@/lib/portal/storage";
import { CO_EMAIL, ML } from "@/lib/portal/mail";
import { fmtMDate, gcalLink, meetCode, todayISO } from "@/lib/portal/helpers";
import { cardS, fldS, labS, secSub, secTitle } from "@/lib/portal/style-tokens";
import { Badge, Priority } from "../ui/Badge";
import { Btn } from "../ui/Btn";
import { DatePicker } from "../ui/DatePicker";
import { TableWrap, THead, TRow } from "../ui/Table";
import { Toggle } from "../ui/Toggle";
import { CamIcon } from "../ui/icons";

const PROJ_TASK_SEED: Record<string, AssignedTask[]> = {
  "Dubai Marina Tower": [
    { id: "s1", task: "MEP Routing — Level 5", assignedTo: "Arjun Mehta", due: "15 Jul", status: "In Progress", priority: "High" },
    { id: "s2", task: "Structural Clash Report", assignedTo: "Sara Al Rashid", due: "10 Jul", status: "Delayed", priority: "High" },
    { id: "s3", task: "Arch Model Update — L1–4", assignedTo: "Arjun Mehta", due: "05 Jul", status: "Completed", priority: "Medium" },
  ],
  "Downtown Mixed-Use Podium": [
    { id: "s4", task: "Arch Model — Podium Level", assignedTo: "Vikram Nair", due: "18 Jul", status: "In Progress", priority: "Medium" },
    { id: "s5", task: "DD Coordination Set", assignedTo: "Vikram Nair", due: "24 Jul", status: "Not Started", priority: "Low" },
  ],
  "Jumeirah Villa Complex": [
    { id: "s6", task: "Concept Massing Model", assignedTo: "Layla Hassan", due: "20 Jul", status: "In Progress", priority: "Medium" },
  ],
};

interface CreateResult {
  task: string;
  person: Person;
  proj: string;
  meetLink: string;
  calLink: string;
  emailLink: string;
  reminderLink: string;
}

export function ProjectTaskSection() {
  const people = readPeople().filter((p) => p.position !== "client");
  const projOptions = PROJECTS.map((p) => p.name);
  const [proj, setProj] = useState(projOptions[0] || "");
  const [who, setWho] = useState(people[0] ? people[0].id : "");
  const [task, setTask] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [withMeet, setWithMeet] = useState(false);
  const [mtime, setMtime] = useState("10:00");
  const [withCal, setWithCal] = useState(true);
  const [withRemind, setWithRemind] = useState(true);
  const [remindOn, setRemindOn] = useState("");
  const [log, setLog] = useState<AssignedTask[]>(() => readAssignedTasks());
  const [result, setResult] = useState<CreateResult | null>(null);
  const [msg, setMsg] = useState("");

  const projObj = PROJECTS.find((p) => p.name === proj);
  const person = people.find((p) => p.id === who);
  const seed = PROJ_TASK_SEED[proj] || [];
  const assignedForProj = log.filter((t) => t.project === proj);
  const allForProj = [...assignedForProj, ...seed];
  const counts = allForProj.reduce((a: Record<string, number>, t) => {
    const s = t.status as string;
    a[s] = (a[s] || 0) + 1;
    return a;
  }, {});
  const dueLabel = due ? fmtMDate(due) : "TBD";

  const create = () => {
    if (!task.trim() || !person) {
      setMsg("⚠ Pick a project, a person and enter a task.");
      return;
    }
    const meetLink = withMeet ? "https://meet.google.com/" + meetCode() : "";
    const t: AssignedTask = {
      id: "T" + String(Date.now()).slice(-6),
      task: task.trim(),
      project: proj,
      assignedTo: person.name,
      assignedRole: person.position,
      del: "Task",
      lod: "—",
      phase: projObj ? projObj.phase : "CD",
      status: "Not Started",
      pct: 0,
      due: dueLabel,
      delay: null,
      priority,
      by: "Admin",
      meetLink,
    };
    addAssignedTask(t);
    addNotif({
      role: person.position,
      title: "New task assigned by Admin",
      body: "Admin assigned: " + t.task + " on " + proj + (due ? " — due " + dueLabel : "") + " (" + priority + " priority).",
      tab: person.position === "employee" ? "My Tasks" : undefined,
    });
    if (withMeet) {
      addMeeting({
        id: "MTG-" + String(Date.now()).slice(-6),
        code: meetLink.split("/").pop() || "",
        title: task.trim() + " — " + proj,
        date: due || todayISO(),
        time: mtime,
        dur: "1 hr",
        link: meetLink,
        organizer: "Admin User",
        organizerRole: "admin",
        attendees: [{ name: person.name, email: person.email, position: person.position }],
        note: "Task: " + task.trim(),
        ts: Date.now(),
      });
      addNotif({
        role: person.position,
        title: "Google Meet invitation",
        body: 'Admin scheduled "' + task.trim() + '" — ' + dueLabel + " at " + mtime + ". Join: " + meetLink,
      });
    }
    if (withRemind) {
      addNotif({
        role: person.position,
        title: "Task reminder set",
        body: 'Reminder for "' + t.task + '"' + (remindOn ? " on " + fmtMDate(remindOn) : due ? " before " + dueLabel : "") + ".",
        tab: person.position === "employee" ? "My Tasks" : undefined,
      });
    }
    setLog(readAssignedTasks());
    const details = "Task: " + task.trim() + "\nProject: " + proj + "\nAssigned to: " + person.name + "\nPriority: " + priority + (meetLink ? "\nGoogle Meet: " + meetLink : "");
    setResult({
      task: t.task as string,
      person,
      proj,
      meetLink,
      calLink: withCal ? gcalLink((withMeet ? "Meeting · " : "Task · ") + task.trim() + " — " + proj, details, due, withMeet ? mtime : "", 60) : "",
      emailLink: ML(
        person.email,
        "New task: " + task.trim() + " [" + proj + "]",
        "Hi " + person.name + ",\n\nYou have a new task on " + proj + ":\n\nTask: " + task.trim() + "\nDue: " + dueLabel + "\nPriority: " + priority + (meetLink ? "\n\nKickoff Google Meet: " + meetLink : "") + "\n\nRegards,\nAdmin\n" + CO_EMAIL,
      ),
      reminderLink: withRemind
        ? ML(
            person.email,
            "Reminder: " + task.trim() + " (" + proj + ")",
            "Hi " + person.name + ',\n\nReminder for your task "' + task.trim() + '" on ' + proj + ", due " + dueLabel + "." + (remindOn ? "\nReminder date: " + fmtMDate(remindOn) : "") + "\n\nRegards,\nAdmin\n" + CO_EMAIL,
          )
        : "",
    });
    setMsg('✓ "' + t.task + '" assigned to ' + person.name + " on " + proj + ".");
    setTask("");
  };

  const lnk = { display: "inline-flex" as const, alignItems: "center" as const, gap: 6, borderRadius: 10, padding: "8px 13px", fontSize: 12.5, fontWeight: 600, textDecoration: "none" as const };

  return (
    <div>
      <div style={cardS}>
        <div style={secTitle}>Create a project task</div>
        <div style={secSub}>
          Select a project and a person to assign the task to. Optionally schedule a Google Meet, add a calendar event, and set an email reminder — the person is notified in their portal and by email.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <label>
            <span style={labS}>Project</span>
            <select
              style={fldS}
              value={proj}
              onChange={(e) => {
                setProj(e.target.value);
                setResult(null);
              }}
            >
              {projOptions.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            <span style={labS}>Assign to</span>
            <select style={fldS} value={who} onChange={(e) => setWho(e.target.value)}>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {POS_LABEL[p.position] || p.position}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={labS}>Task</span>
          <input style={fldS} value={task} onChange={(e) => setTask(e.target.value)} placeholder="e.g. Coordinate MEP — Level 9" />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
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
        <span style={labS}>Add to this task</span>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
          <Toggle on={withMeet} set={setWithMeet} label="Create Google Meet" />
          {withMeet && (
            <label style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, color: "#5C594F" }}>
              at <input type="time" style={{ ...fldS, width: 120, padding: "7px 9px" }} value={mtime} onChange={(e) => setMtime(e.target.value)} />
            </label>
          )}
          <Toggle on={withCal} set={setWithCal} label="Add calendar event" />
          <Toggle on={withRemind} set={setWithRemind} label="Set task reminder" />
          {withRemind && (
            <label style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, color: "#5C594F" }}>
              on <DatePicker value={remindOn} onChange={(e) => setRemindOn(e.target.value)} style={{ width: 160 }} placeholder="Pick date" />
            </label>
          )}
        </div>
        <Btn v="p" onClick={create} xs={{ whiteSpace: "nowrap" }}>
          + Create &amp; assign task
        </Btn>
        {msg && <div style={{ marginTop: 13, fontSize: 12.5, fontWeight: 500, color: msg[0] === "⚠" ? "var(--red)" : "var(--green)" }}>{msg}</div>}
        {result && (
          <div style={{ marginTop: 16, background: "#FAF9F6", border: "1px solid #E5E2DA", borderRadius: 12, padding: "15px 16px" }}>
            <div style={{ fontSize: 12, color: "#8A867C", marginBottom: 10 }}>
              &ldquo;{result.task}&rdquo; → <b style={{ color: "#171717" }}>{result.person.name}</b> · {result.proj}
            </div>
            {result.meetLink && (
              <div style={{ background: "#fff", border: "1px solid #E5E2DA", borderRadius: 10, padding: "11px 13px", display: "flex", alignItems: "center", gap: 11, marginBottom: 11 }}>
                <span style={{ width: 28, height: 28, borderRadius: 7, background: "#1A7A4A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CamIcon size={14} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: "#8A867C" }}>Google Meet</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1A56C4" }}>{result.meetLink}</div>
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
              {result.calLink && (
                <a href={result.calLink} target="_blank" rel="noopener" style={{ ...lnk, background: "#fff", color: "#171717", border: "1.5px solid #E5E2DA" }}>
                  📅 Add to Google Calendar
                </a>
              )}
              <a href={result.emailLink} style={{ ...lnk, background: "#171717", color: "#fff" }}>
                ✉ Email task to {result.person.name.split(" ")[0]}
              </a>
              {result.reminderLink && (
                <a href={result.reminderLink} style={{ ...lnk, background: "#fff", color: "#171717", border: "1.5px solid #E5E2DA" }}>
                  ⏰ Send reminder email
                </a>
              )}
            </div>
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, margin: "0 0 12px", flexWrap: "wrap" }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>
          Tasks in {proj} <span style={{ color: "#8A867C", fontWeight: 400 }}>· {allForProj.length}</span>
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
      {allForProj.length === 0 ? (
        <div style={{ background: "#fff", border: "1px dashed #E5E2DA", borderRadius: 12, padding: "28px", textAlign: "center", color: "#8A867C", fontSize: 13 }}>
          No tasks for this project yet.
        </div>
      ) : (
        <TableWrap>
          <THead cols={["Task", "Assigned to", "Priority", "Due", "Status"]} tpl="2fr 1.3fr 90px 110px 120px" />
          {allForProj.map((t) => (
            <TRow key={t.id} tpl="2fr 1.3fr 90px 110px 120px">
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                {t.task as string}
                {t.meetLink ? (
                  <span title="Has meeting" style={{ marginLeft: 7, color: "#1A7A4A", fontSize: 11 }}>
                    ● meet
                  </span>
                ) : null}
              </span>
              <span style={{ fontSize: 12, color: "#5C594F" }}>{t.assignedTo as string}</span>
              <Priority p={(t.priority as string) || "Medium"} />
              <span style={{ fontSize: 12, color: "#5C594F" }}>{t.due as string}</span>
              <Badge s={t.status as string} />
            </TRow>
          ))}
        </TableWrap>
      )}
    </div>
  );
}
