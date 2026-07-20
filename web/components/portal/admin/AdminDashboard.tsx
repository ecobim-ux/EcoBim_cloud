"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchIssues, type ApiIssue } from "@/lib/portal/issues";
import { fetchLeads, type ApiLead } from "@/lib/portal/leads";
import { fetchProjects, type ApiProject } from "@/lib/portal/projects";
import { fetchTeam, type ApiTeamMember } from "@/lib/portal/team";
import { initials } from "@/lib/portal/helpers";
import { CommandPalette } from "../layout/CommandPalette";
import { Main } from "../layout/Main";
import { MobileTopBar } from "../layout/MobileTopBar";
import { NotifBell } from "../layout/NotifBell";
import { SearchBtn } from "../layout/SearchBtn";
import { Sidebar } from "../layout/Sidebar";
import { useCollapse } from "../layout/useCollapse";
import { useNotifications } from "../layout/useNotifications";
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
  userName: string;
}

export function AdminDashboard({ onSwitch, initialTab, userName }: AdminDashboardProps) {
  const [tab, setTab] = useState(initialTab || "All Projects");
  const [showNotif, setShowNotif] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [collapsed, toggleCollapse] = useCollapse();
  const [mobOpen, setMobOpen] = useState(false);
  const [issues, setIssues] = useState<ApiIssue[]>([]);
  const [leads, setLeads] = useState<ApiLead[]>([]);
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [team, setTeam] = useState<ApiTeamMember[]>([]);

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  const loadIssues = useCallback(() => {
    fetchIssues().then(setIssues);
  }, []);

  useEffect(() => {
    loadIssues();
    fetchLeads().then(setLeads);
    fetchProjects().then(setProjects);
    fetchTeam().then(setTeam);
  }, [loadIssues]);

  const notif = useNotifications();
  const tabs = ["All Projects", "Team Management", "Client Management", "Management", "Reports"];
  const newReqCount = leads.filter((r) => r.status === "New").length;
  const openIssueCount = issues.filter((i) => !i.resolved).length;
  const displayName = userName || "—";

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
        role="admin"
        open={showSearch}
        onClose={() => setShowSearch(false)}
        onNav={(t) => {
          setShowSearch(false);
          setTab(t);
        }}
        onAction={() => setShowSearch(false)}
      />
      <MobileTopBar onMenuOpen={() => setMobOpen(true)} userName={displayName} role="Admin" />
      <Sidebar
        tabs={tabs}
        active={tab}
        setTab={setTab}
        role="Admin"
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
                {displayName} <RoleTag role="admin" />
              </h1>
              <PhasePill p="Administrator" />
            </div>
            <div style={{ fontSize: 13, color: "#8A867C" }}>
              {projects.length} active projects · {team.length} team members · {openIssueCount} open issues
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <SearchBtn onClick={() => setShowSearch(true)} />
            <ScheduleMeetingButton role="admin" userName={displayName} />
            <NotifBell count={notif.total} onClick={() => setShowNotif((s) => !s)} />
          </div>
        </div>
        <div className="stat-grid">
          <StatCard label="Active Projects" value={String(projects.length)} sub="across all clients" color="var(--ink)" />
          <StatCard label="Team Members" value={String(team.length)} sub="active this week" color="var(--green)" />
          <StatCard label="Unresolved Issues" value={String(openIssueCount)} sub="across all projects" color="var(--red)" />
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
