"use client";

import { useEffect, useState } from "react";
import { ISSUES, PROJECTS, TEAM } from "@/lib/portal/data";
import { getUnreadCounts, getUnreadTotal, readRequests } from "@/lib/portal/storage";
import { CommandPalette } from "../layout/CommandPalette";
import { Main } from "../layout/Main";
import { MobileTopBar } from "../layout/MobileTopBar";
import { NotifBell } from "../layout/NotifBell";
import { SearchBtn } from "../layout/SearchBtn";
import { Sidebar } from "../layout/Sidebar";
import { useCollapse } from "../layout/useCollapse";
import { ScheduleMeetingButton } from "../shared/ScheduleMeetingButton";
import { NotifPopup } from "../ui/NotifPopup";
import { RoleTag } from "../ui/RoleTag";
import { StatCard } from "../ui/StatCard";
import { PhasePill } from "../ui/icons";
import { AllProjectsTab } from "./AllProjectsTab";
import { ClientManagementTab } from "./ClientManagementTab";
import { ManagementTab } from "./ManagementTab";
import { ReportsTab } from "./ReportsTab";
import { TeamManagementTab } from "./TeamManagementTab";

interface AdminDashboardProps {
  onSwitch: () => void;
  initialTab: string | null;
  showToast: (msg: string, type?: import("../ui/Toast").ToastType) => void;
}

export function AdminDashboard({ onSwitch, initialTab }: AdminDashboardProps) {
  const [tab, setTab] = useState(initialTab || "All Projects");
  const [showNotif, setShowNotif] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [collapsed, toggleCollapse] = useCollapse();
  const [mobOpen, setMobOpen] = useState(false);

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  const notifCounts = getUnreadCounts("admin");
  const tabs = ["All Projects", "Team Management", "Client Management", "Management", "Reports"];
  const newReqCount = readRequests().filter((r) => r.status === "New").length;

  return (
    <div style={{ display: "flex" }}>
      {showNotif && (
        <NotifPopup
          role="admin"
          onClose={() => setShowNotif(false)}
          onNav={(t) => {
            setShowNotif(false);
            setTab(t);
          }}
        />
      )}
      <CommandPalette
        role="admin"
        open={showSearch}
        onClose={() => setShowSearch(false)}
        onNav={(t) => {
          setShowSearch(false);
          setTab(t);
        }}
        onAction={() => setShowSearch(false)}
      />
      <MobileTopBar onMenuOpen={() => setMobOpen(true)} userName="Admin User" role="Admin" />
      <Sidebar
        tabs={tabs}
        active={tab}
        setTab={setTab}
        role="Admin"
        userName="Admin User"
        userIni="AD"
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
                Admin User <RoleTag role="admin" />
              </h1>
              <PhasePill p="Administrator" />
            </div>
            <div style={{ fontSize: 13, color: "#8A867C" }}>
              {PROJECTS.length} active projects · {TEAM.length} team members · {ISSUES.filter((i) => i.status !== "Closed").length} open issues
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <SearchBtn onClick={() => setShowSearch(true)} />
            <ScheduleMeetingButton role="admin" userName="Admin User" />
            <NotifBell count={getUnreadTotal("admin")} onClick={() => setShowNotif((s) => !s)} />
          </div>
        </div>
        <div className="stat-grid">
          <StatCard label="Active Projects" value={String(PROJECTS.length)} sub="across all clients" color="var(--ink)" />
          <StatCard label="Team Members" value={String(TEAM.length)} sub="active this week" color="var(--green)" />
          <StatCard label="Unresolved Issues" value={String(ISSUES.filter((i) => i.status !== "Closed").length)} sub="across all projects" color="var(--red)" />
          <StatCard label="New Requests" value={String(newReqCount)} sub="from website" color={newReqCount > 0 ? "var(--red)" : "var(--green)"} />
        </div>
        {tab === "All Projects" && <AllProjectsTab />}
        {tab === "Team Management" && <TeamManagementTab />}
        {tab === "Client Management" && <ClientManagementTab />}
        {tab === "Management" && <ManagementTab />}
        {tab === "Reports" && <ReportsTab />}
      </Main>
    </div>
  );
}
