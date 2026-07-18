"use client";

import { useEffect, useState } from "react";
import { MY_TASKS, type MyTask } from "@/lib/portal/data";
import { getUnreadCounts, getUnreadTotal, readAssignedTasks } from "@/lib/portal/storage";
import { CommandPalette } from "../layout/CommandPalette";
import { Main } from "../layout/Main";
import { MobileTopBar } from "../layout/MobileTopBar";
import { NotifBell } from "../layout/NotifBell";
import { SearchBtn } from "../layout/SearchBtn";
import { Sidebar } from "../layout/Sidebar";
import { useCollapse } from "../layout/useCollapse";
import { ScheduleMeetingButton } from "../shared/ScheduleMeetingButton";
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
}

export function EmployeeDashboard({ onSwitch, initialTab }: EmployeeDashboardProps) {
  const tabs = ["My Tasks", "Productivity", "RFIs", "Milestones"];
  const [tab, setTab] = useState(initialTab || "My Tasks");
  const [showNotif, setShowNotif] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [collapsed, toggleCollapse] = useCollapse();
  const [mobOpen, setMobOpen] = useState(false);

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  const notifCounts = getUnreadCounts("employee");
  const assignedTasks = readAssignedTasks().filter((t) => t.assignedTo === "Arjun Mehta");
  const allTasks = [...MY_TASKS, ...assignedTasks];
  const completed = allTasks.filter((t) => (t as { status?: string }).status === "Completed").length;
  const delayed = allTasks.filter((t) => (t as { status?: string }).status === "Delayed").length;

  return (
    <div style={{ display: "flex" }}>
      {showNotif && (
        <NotifPopup
          role="employee"
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
      <MobileTopBar onMenuOpen={() => setMobOpen(true)} userName="Arjun Mehta" role="Employee" />
      <Sidebar
        tabs={tabs}
        active={tab}
        setTab={setTab}
        role="Employee"
        userName="Arjun Mehta"
        userIni="AM"
        onSwitch={onSwitch}
        notifCounts={notifCounts}
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
                Arjun Mehta <RoleTag role="employee" />
              </h1>
              <PhasePill p="BIM Coordinator" />
            </div>
            <div style={{ fontSize: 13, color: "#8A867C" }}>Dubai Marina Tower · Active project</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <SearchBtn onClick={() => setShowSearch(true)} />
            <ScheduleMeetingButton role="employee" userName="Arjun Mehta" />
            <NotifBell count={getUnreadTotal("employee")} onClick={() => setShowNotif((s) => !s)} />
          </div>
        </div>
        <div className="stat-grid">
          <StatCard label="Overall Progress" value="68%" sub="Construction Docs phase" color="var(--ink)" />
          <StatCard label="Tasks Completed" value={`${completed}/${allTasks.length}`} sub="this sprint" color="var(--green)" />
          <StatCard label="Delayed Tasks" value={String(delayed)} sub="needs attention" color="var(--red)" />
          <StatCard label="Hours This Week" value="23.5h" sub="of 40h estimated" color="var(--amber)" />
        </div>
        {tab === "My Tasks" && <MyTasksTab tasks={allTasks as unknown as MyTask[]} />}
        {tab === "Productivity" && <ProductivityTab />}
        {tab === "RFIs" && <EmployeeRFIsTab />}
        {tab === "Milestones" && <MilestonesTab />}
      </Main>
    </div>
  );
}
