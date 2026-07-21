"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type { ApiTask } from "@/app/api/tasks/route";
import { usePeople } from "../PeopleProvider";
import { sendNotification } from "@/lib/portal/notifications";
import { Badge } from "../ui/Badge";
import { Btn } from "../ui/Btn";
import { DelIcon } from "../ui/icons";
import { PBar } from "../ui/PBar";
import { PingLeadModal } from "./PingLeadModal";
import { TableWrap, THead, TRow } from "../ui/Table";
import { notify } from "../ui/Toast";

const PRI_RANK: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
const PRI_COL: Record<string, string> = { High: "#C0392B", Medium: "#B8860B", Low: "#8A867C" };

function TaskMeta({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 10, color: "#8A867C", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
      <span style={{ fontSize: 12.5, color: "#171717", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

interface MyTasksTabProps {
  tasks: ApiTask[];
  userName: string;
  onRefetch: () => void;
}

export function MyTasksTab({ tasks, userName, onRefetch }: MyTasksTabProps) {
  const { people } = usePeople();
  const [hrs, setHrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [ping, setPing] = useState(false);
  const [flash, setFlash] = useState("");

  const active = [...tasks]
    .filter((t) => t.status !== "Completed")
    .sort((a, b) => {
      const at = a.today ? 0 : 1;
      const bt = b.today ? 0 : 1;
      if (at !== bt) return at - bt;
      return (PRI_RANK[a.priority] ?? 1) - (PRI_RANK[b.priority] ?? 1);
    });
  const completed = tasks.filter((t) => t.status === "Completed");

  const logHours = async (id: string) => {
    const v = parseFloat(hrs[id]);
    if (!v || v <= 0) return;
    setBusy((p) => ({ ...p, [id]: true }));
    try {
      const res = await fetch(`/api/tasks/${id}/time`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours: v }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        notify(data.error || "Couldn't log time.", "error");
        return;
      }
      setHrs((p) => ({ ...p, [id]: "" }));
      setFlash("✓ Logged " + v + "h");
      notify("Logged " + v + "h on this task", "success");
      setTimeout(() => setFlash(""), 1800);
      onRefetch();
    } catch {
      notify("Couldn't reach the server. Please try again.", "error");
    } finally {
      setBusy((p) => ({ ...p, [id]: false }));
    }
  };

  const complete = async (t: ApiTask) => {
    if (t.logged <= 0) return;
    setBusy((p) => ({ ...p, [t.id]: true }));
    try {
      const res = await fetch(`/api/tasks/${t.id}/complete`, { method: "POST" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        notify(data.error || "Couldn't complete this task.", "error");
        return;
      }
      sendNotification({
        recipientLoginIds: [people.find((p) => p.position === "teamlead")?.loginId],
        title: "Task completed",
        body: userName + ' completed "' + t.task + '" — ' + t.logged + "h logged.",
        tab: "Overview",
      });
      notify("Task marked complete", "success");
      setFlash("✓ Task completed");
      setTimeout(() => setFlash(""), 1800);
      onRefetch();
    } catch {
      notify("Couldn't reach the server. Please try again.", "error");
    } finally {
      setBusy((p) => ({ ...p, [t.id]: false }));
    }
  };

  const renderCard = (t: ApiTask) => {
    const pct = Math.min(100, Math.round((t.logged / t.est) * 100));
    const canComplete = t.logged > 0 && !busy[t.id];
    return (
      <div key={t.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E2DA", borderLeft: "3px solid " + PRI_COL[t.priority], padding: "16px 20px", marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <DelIcon type={t.del} />
              <span style={{ fontSize: 15, fontWeight: 600 }}>{t.task}</span>
            </span>
            {t.today && (
              <span style={{ background: "#171717", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12, letterSpacing: "0.04em" }}>
                TODAY
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: PRI_COL[t.priority] }}>{t.priority}</span>
            <Badge s={t.status} />
          </div>
        </div>
        {t.delay && (
          <div style={{ background: "#FDECEA", border: "1px solid #FFCDD2", borderRadius: 12, padding: "9px 13px", marginBottom: 12, fontSize: 12.5, color: "#C0392B", display: "flex", gap: 8 }}>
            <span>⚠</span>
            <span>
              <b>Delay:</b> {t.delay}
            </span>
          </div>
        )}
        {t.description && (
          <div style={{ background: "#FAF9F6", border: "1px solid #F2F0EA", borderRadius: 12, padding: "9px 13px", marginBottom: 12, fontSize: 12.5, color: "#5C594F", lineHeight: 1.5 }}>
            <b style={{ color: "#171717" }}>Note:</b> {t.description}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 14, marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #F2F0EA" }}>
          <TaskMeta label="Project" value={t.project} />
          <TaskMeta label="Assigned by" value={t.by} />
          <TaskMeta label="Due" value={t.due || "—"} />
          <TaskMeta label="LOD / Phase" value={t.lod + " · " + t.phase} />
          <TaskMeta label="Est. hours" value={t.est + "h"} />
          <TaskMeta label="Logged" value={t.logged + "h"} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <PBar pct={pct} status={t.status} label={t.task} />
          <span style={{ fontSize: 11, color: "#8A867C", whiteSpace: "nowrap" }}>
            {t.logged}/{t.est}h logged
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="text"
            inputMode="decimal"
            placeholder="+ hours e.g. 2.5"
            value={hrs[t.id] || ""}
            disabled={busy[t.id]}
            onChange={(e) => setHrs((p) => ({ ...p, [t.id]: e.target.value }))}
            style={{ width: 150, padding: "8px 12px", border: "1px solid #E5E2DA", borderRadius: 12, fontSize: 13, background: "#F6F4EF" }}
            onKeyDown={(e) => {
              if (e.key === "Enter") logHours(t.id);
            }}
          />
          <Btn v="s" xs={{ padding: "8px 14px", fontSize: 12 }} onClick={() => logHours(t.id)}>
            ⏱ Log time
          </Btn>
          <button
            onClick={() => complete(t)}
            disabled={!canComplete}
            title={canComplete ? "Mark complete" : "Log time before completing"}
            style={{ padding: "8px 16px", borderRadius: 12, fontSize: 12, fontWeight: 600, border: "none", background: canComplete ? "#1A7A4A" : "#D8D5CD", color: "#fff", cursor: canComplete ? "pointer" : "not-allowed" }}
          >
            ✓ Mark complete
          </button>
          {t.logged <= 0 && <span style={{ fontSize: 11.5, color: "#8A867C" }}>Log time before completing</span>}
        </div>
      </div>
    );
  };

  return (
    <div>
      {ping && <PingLeadModal userName={userName} onClose={() => setPing(false)} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600 }}>
            Today&apos;s Active Tasks <span style={{ color: "#8A867C", fontWeight: 400 }}>· {active.length}</span>
          </h3>
          <p style={{ fontSize: 12.5, color: "#8A867C", marginTop: 2 }}>
            Assigned by your Team Lead and Admin — highest priority first. Log time before marking anything complete.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {flash && <span style={{ fontSize: 12.5, color: "#1A7A4A", fontWeight: 600 }}>{flash}</span>}
          <button
            className="btn-pi"
            style={{ background: "#fff", color: "#171717", border: "1.5px solid #171717", borderRadius: 12, padding: "7px 14px", fontSize: 13, fontWeight: 500, transition: "background .15s" }}
            onClick={() => setPing(true)}
          >
            Raise Issue to Team Lead
          </button>
        </div>
      </div>
      {active.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px dashed #E5E2DA", padding: "40px", textAlign: "center", color: "#8A867C", fontSize: 14 }}>
          No active tasks — you&apos;re all caught up.
        </div>
      ) : (
        active.map(renderCard)
      )}
      <div style={{ fontSize: 15, fontWeight: 600, margin: "28px 0 6px" }}>
        Completed — history log <span style={{ color: "#8A867C", fontWeight: 400 }}>· {completed.length}</span>
      </div>
      <p style={{ fontSize: 12.5, color: "#8A867C", marginBottom: 14 }}>Finished tasks with their logged time records.</p>
      {completed.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px dashed #E5E2DA", padding: "28px", textAlign: "center", color: "#8A867C", fontSize: 13 }}>
          Nothing completed yet.
        </div>
      ) : (
        <TableWrap>
          <THead cols={["Task", "Priority", "Completed", "Logged", "Time records"]} tpl="2fr 90px 120px 90px 1.4fr" />
          {completed.map((t) => (
            <TRow key={t.id} tpl="2fr 90px 120px 90px 1.4fr">
              <span style={{ fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#1A7A4A" }}>✓</span>
                {t.task}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: PRI_COL[t.priority] }}>{t.priority}</span>
              <span style={{ fontSize: 12, color: "#5C594F" }}>{t.completedOn || t.due}</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{t.logged || t.est}h</span>
              <span style={{ fontSize: 11.5, color: "#8A867C" }}>
                {t.records && t.records.length ? t.records.map((r) => r.hours + "h (" + r.date + ")").join(", ") : "—"}
              </span>
            </TRow>
          ))}
        </TableWrap>
      )}
    </div>
  );
}
