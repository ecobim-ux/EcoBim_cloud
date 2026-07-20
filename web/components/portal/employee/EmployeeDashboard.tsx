"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiTask } from "@/app/api/tasks/route";
import { initials, startOfWeekISO } from "@/lib/portal/helpers";
import { fetchProjects, type ApiProject } from "@/lib/portal/projects";
import { CommandPalette } from "../layout/CommandPalette";
import { Main } from "../layout/Main";
import { MobileTopBar } from "../layout/MobileTopBar";
import { NotifBell } from "../layout/NotifBell";
import { SearchBtn } from "../layout/SearchBtn";
import { Sidebar } from "../layout/Sidebar";
import { useCollapse } from "../layout/useCollapse";
import { useNotifications } from "../layout/useNotifications";
import { ScheduleMeetingButton } from "../shared/ScheduleMeetingButton";
import { UpcomingMeetings } from "../shared/UpcomingMeetings";
import { StatCard } from "../ui/StatCard";
import { NotifPopup } from "../ui/NotifPopup";
import { RoleTag } from "../ui/RoleTag";
import { PhasePill } from "../ui/icons";
import { EmployeeRFIsTab } from "./EmployeeRFIsTab";
import { MilestonesTab } from "./MilestonesTab";
import { MyTasksTab } from "./MyTasksTab";
import { ProductivityTab } from "./ProductivityTab";

interface EmployeeDashboardProps {
  onSwitch: () => void;
  initialTab: string | null;
  showToast: (msg: string, type?: import("../ui/Toast").ToastType) => void;
  userName: string;
}

export function EmployeeDashboard({ onSwitch, initialTab, userName }: EmployeeDashboardProps) {
  const tabs = ["My Tasks", "Productivity", "RFIs", "Milestones"];
  const [tab, setTab] = useState(initialTab || "My Tasks");
  const [showNotif, setShowNotif] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [collapsed, toggleCollapse] = useCollapse();
  const [mobOpen, setMobOpen] = useState(false);
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [projects, setProjects] = useState<ApiProject[]>([]);

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  const loadTasks = useCallback(() => {
    fetch("/api/tasks")
      .then((r) => r.json() as Promise<{ tasks?: ApiTask[] }>)
      .then((data) => setTasks(data.tasks || []))
      .catch(() => setTasks([]));
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    fetchProjects().then(setProjects);
  }, []);

  const notif = useNotifications();
  const completed = tasks.filter((t) => t.status === "Completed").length;
  const delayed = tasks.filter((t) => t.status === "Delayed").length;
  const weekStart = startOfWeekISO();
  const hoursThisWeek = tasks
    .flatMap((t) => t.records)
    .filter((r) => r.date >= weekStart)
    .reduce((a, r) => a + (r.hours || 0), 0);
  const displayName = userName || "—";
  const primaryProject = projects[0] ?? null;

  return (
    <div style={{ display: "flex" }}>
      {showNotif && (
        <NotifPopup
          notifs={notif.unread}
          onDismiss={notif.dismiss}
          onDismissAll={notif.dismissAll}
          onClose={() => setShowNotif(false)}
          onNav={(t) => {
            setShowNotif(false);
            setTab(t);
          }}
        />
      )}
      <CommandPalette
        role="employee"
        open={showSearch}
        onClose={() => setShowSearch(false)}
        onNav={(t) => {
          setShowSearch(false);
          setTab(t);
        }}
        onAction={() => setShowSearch(false)}
      />
      <MobileTopBar onMenuOpen={() => setMobOpen(true)} userName={displayName} role="Employee" />
      <Sidebar
        tabs={tabs}
        active={tab}
        setTab={setTab}
        role="Employee"
        userName={displayName}
        userIni={initials(displayName)}
        onSwitch={onSwitch}
        notifCounts={notif.counts}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        mobOpen={mobOpen}
        onMobClose={() => setMobOpen(false)}
      />
      <Main collapsed={collapsed}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontSize: 22, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                {displayName} <RoleTag role="employee" />
              </h1>
              <PhasePill p="BIM Coordinator" />
            </div>
            <div style={{ fontSize: 13, color: "#8A867C" }}>{primaryProject ? primaryProject.name + " · Active project" : "No active project yet"}</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <SearchBtn onClick={() => setShowSearch(true)} />
            <ScheduleMeetingButton role="employee" userName={displayName} />
            <NotifBell count={notif.total} onClick={() => setShowNotif((s) => !s)} />
          </div>
        </div>
        <div className="stat-grid">
          <StatCard label="Overall Progress" value={primaryProject ? primaryProject.progress + "%" : "—"} sub={primaryProject?.phaseLabel ? primaryProject.phaseLabel + " phase" : "No project yet"} color="var(--ink)" />
          <StatCard label="Tasks Completed" value={`${completed}/${tasks.length}`} sub="this sprint" color="var(--green)" />
          <StatCard label="Delayed Tasks" value={String(delayed)} sub="needs attention" color="var(--red)" />
          <StatCard label="Hours This Week" value={`${hoursThisWeek}h`} sub="logged since Monday" color="var(--amber)" />
        </div>
        <UpcomingMeetings />
        {tab === "My Tasks" && <MyTasksTab tasks={tasks} userName={displayName} onRefetch={loadTasks} />}
        {tab === "Productivity" && <ProductivityTab tasks={tasks} />}
        {tab === "RFIs" && <EmployeeRFIsTab userName={displayName} />}
        {tab === "Milestones" && <MilestonesTab tasks={tasks} />}
      </Main>
    </div>
  );
}
