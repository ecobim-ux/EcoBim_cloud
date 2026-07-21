"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiTask } from "@/app/api/tasks/route";
import { STATUS_DOT } from "@/lib/portal/data";
import { POS_LABEL, type ApiPerson } from "@/lib/portal/people";
import { fetchProjects } from "@/lib/portal/projects";
import { usePeople } from "../PeopleProvider";
import { CO_EMAIL, ML } from "@/lib/portal/mail";
import { fmtMDate, gcalLink, meetCode, todayISO } from "@/lib/portal/helpers";
import { scheduleMeeting } from "@/lib/portal/meetings";
import { sendNotification } from "@/lib/portal/notifications";
import { fetchTasks } from "@/lib/portal/tasks";
import { cardS, fldS, labS, secSub, secTitle } from "@/lib/portal/style-tokens";
import { Badge, Priority } from "../ui/Badge";
import { Btn } from "../ui/Btn";
import { DatePicker } from "../ui/DatePicker";
import { TableWrap, THead, TRow } from "../ui/Table";
import { Toggle } from "../ui/Toggle";
import { CamIcon } from "../ui/icons";

interface CreateResult {
  task: string;
  person: ApiPerson;
  proj: string;
  meetLink: string;
  calLink: string;
  emailLink: string;
  reminderLink: string;
}

export function ProjectTaskSection() {
  const { people: allPeople } = usePeople();
  const people = allPeople.filter((p) => p.position !== "client");
  const [projOptions, setProjOptions] = useState<string[]>([]);
  const [proj, setProj] = useState("");
  const [who, setWho] = useState("");
  const [task, setTask] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [withMeet, setWithMeet] = useState(false);
  const [mtime, setMtime] = useState("10:00");
  const [withCal, setWithCal] = useState(true);
  const [withRemind, setWithRemind] = useState(true);
  const [remindOn, setRemindOn] = useState("");
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [result, setResult] = useState<CreateResult | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    fetchTasks().then(setTasks);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    fetchProjects().then((projects) => setProjOptions(projects.map((p) => p.name)));
  }, []);

  useEffect(() => {
    if (!who && people.length > 0) setWho(people[0].partyId);
  }, [people, who]);

  useEffect(() => {
    if (!proj && projOptions.length > 0) setProj(projOptions[0]);
  }, [projOptions, proj]);

  const person = people.find((p) => p.partyId === who);
  const allForProj = tasks.filter((t) => t.project === proj);
  const counts = allForProj.reduce((a: Record<string, number>, t) => {
    a[t.status] = (a[t.status] || 0) + 1;
    return a;
  }, {} as Record<string, number>);
  const dueLabel = due ? fmtMDate(due) : "TBD";

  const create = async () => {
    if (busy) return;
    if (!task.trim() || !person) {
      setMsg("⚠ Pick a project, a person and enter a task.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: task.trim(), assigneeLoginId: person.loginId, projectName: proj, priority, dueOn: due || undefined }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg("⚠ " + (data.error || "Couldn't create that task."));
        return;
      }
    } catch {
      setMsg("⚠ Couldn't reach the server. Please try again.");
      return;
    } finally {
      setBusy(false);
    }

    const meetLink = withMeet ? "https://meet.google.com/" + meetCode() : "";
    const taskTitle = task.trim();
    sendNotification({
      recipientLoginIds: [person.loginId],
      title: "New task assigned by Admin",
      body: "Admin assigned: " + taskTitle + " on " + proj + (due ? " — due " + dueLabel : "") + " (" + priority + " priority).",
      tab: person.position === "employee" ? "My Tasks" : undefined,
    });
    if (withMeet) {
      scheduleMeeting({
        title: taskTitle + " — " + proj,
        date: due || todayISO(),
        time: mtime,
        duration: "1 hr",
        joinUrl: meetLink,
        note: "Task: " + taskTitle,
        attendeeLoginIds: [person.loginId],
      });
      sendNotification({
        recipientLoginIds: [person.loginId],
        title: "Google Meet invitation",
        body: 'Admin scheduled "' + taskTitle + '" — ' + dueLabel + " at " + mtime + ". Join: " + meetLink,
      });
    }
    if (withRemind) {
      sendNotification({
        recipientLoginIds: [person.loginId],
        title: "Task reminder set",
        body: 'Reminder for "' + taskTitle + '"' + (remindOn ? " on " + fmtMDate(remindOn) : due ? " before " + dueLabel : "") + ".",
        tab: person.position === "employee" ? "My Tasks" : undefined,
      });
    }
    refresh();
    const details = "Task: " + taskTitle + "\nProject: " + proj + "\nAssigned to: " + person.name + "\nPriority: " + priority + (meetLink ? "\nGoogle Meet: " + meetLink : "");
    setResult({
      task: taskTitle,
      person,
      proj,
      meetLink,
      calLink: withCal ? gcalLink((withMeet ? "Meeting · " : "Task · ") + taskTitle + " — " + proj, details, due, withMeet ? mtime : "", 60) : "",
      emailLink: ML(
        person.email || "",
        "New task: " + taskTitle + " [" + proj + "]",
        "Hi " + person.name + ",\n\nYou have a new task on " + proj + ":\n\nTask: " + taskTitle + "\nDue: " + dueLabel + "\nPriority: " + priority + (meetLink ? "\n\nKickoff Google Meet: " + meetLink : "") + "\n\nRegards,\nAdmin\n" + CO_EMAIL,
      ),
      reminderLink: withRemind
        ? ML(
            person.email || "",
            "Reminder: " + taskTitle + " (" + proj + ")",
            "Hi " + person.name + ',\n\nReminder for your task "' + taskTitle + '" on ' + proj + ", due " + dueLabel + "." + (remindOn ? "\nReminder date: " + fmtMDate(remindOn) : "") + "\n\nRegards,\nAdmin\n" + CO_EMAIL,
          )
        : "",
    });
    setMsg('✓ "' + taskTitle + '" assigned to ' + person.name + " on " + proj + ".");
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
                <option key={p.partyId} value={p.partyId}>
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
        <Btn v="p" onClick={create} disabled={busy} xs={{ whiteSpace: "nowrap" }}>
          {busy ? "Creating…" : "+ Create & assign task"}
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
              <span style={{ fontSize: 13, fontWeight: 500 }}>{t.task}</span>
              <span style={{ fontSize: 12, color: "#5C594F" }}>{t.assignedTo}</span>
              <Priority p={t.priority || "Medium"} />
              <span style={{ fontSize: 12, color: "#5C594F" }}>{t.due || "TBD"}</span>
              <Badge s={t.status} />
            </TRow>
          ))}
        </TableWrap>
      )}
    </div>
  );
}
