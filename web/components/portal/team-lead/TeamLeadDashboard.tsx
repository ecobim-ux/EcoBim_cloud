"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchApprovals, type ApiApproval } from "@/lib/portal/approvals";
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
import { RaiseIssueButton } from "../shared/RaiseIssueButton";
import { LeadApprovalReqButton } from "../admin/LeadApprovalReqButton";
import { NotifPopup } from "../ui/NotifPopup";
import { RoleTag } from "../ui/RoleTag";
import { StatCard } from "../ui/StatCard";
import { PhasePill } from "../ui/icons";
import { AssignedRequestsTab } from "./AssignedRequestsTab";
import { IssuesTab } from "./IssuesTab";
import { LeadTasksTab } from "./LeadTasksTab";
import { MyTeamTab } from "./MyTeamTab";
import { RFIsTab } from "./RFIsTab";
import { TeamOverviewTab } from "./TeamOverviewTab";

interface TeamLeadDashboardProps {
  onSwitch: () => void;
  initialTab: string | null;
  showToast: (msg: string, type?: import("../ui/Toast").ToastType) => void;
  userName: string;
}

export function TeamLeadDashboard({ onSwitch, initialTab, userName }: TeamLeadDashboardProps) {
  const [tab, setTab] = useState(initialTab || "Overview");
  const [showNotif, setShowNotif] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [collapsed, toggleCollapse] = useCollapse();
  const [mobOpen, setMobOpen] = useState(false);
  const [issues, setIssues] = useState<ApiIssue[]>([]);
  const [leads, setLeads] = useState<ApiLead[]>([]);
  const [approvals, setApprovals] = useState<ApiApproval[]>([]);
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
    fetchApprovals().then(setApprovals);
    fetchProjects().then(setProjects);
    fetchTeam().then(setTeam);
  }, [loadIssues]);

  const notif = useNotifications();
  const tabs = ["Overview", "My Team", "Issues", "RFIs", "Requests", "Tasks"];
  const avgPct = team.length > 0 ? Math.round(team.reduce((a, t) => a + t.pct, 0) / team.length) : 0;
  const openIssueCount = issues.filter((i) => !i.resolved).length;
  const pendingApprovalCount = approvals.filter((a) => a.stage !== "Approved" && a.stage !== "Rejected").length;
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
        role="teamlead"
        open={showSearch}
        onClose={() => setShowSearch(false)}
        onNav={(t) => {
          setShowSearch(false);
          setTab(t);
        }}
        onAction={() => setShowSearch(false)}
      />
      <MobileTopBar onMenuOpen={() => setMobOpen(true)} userName={displayName} role="Team Lead" />
      <Sidebar
        tabs={tabs}
        active={tab}
        setTab={setTab}
        role="Team Lead"
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
                {displayName} <RoleTag role="teamlead" />
              </h1>
              <PhasePill p="Senior BIM Lead" />
            </div>
            <div style={{ fontSize: 13, color: "#8A867C" }}>{projects[0] ? projects[0].name + " · Active project" : "No active project yet"}</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <SearchBtn onClick={() => setShowSearch(true)} />
            <ScheduleMeetingButton role="teamlead" userName={displayName} compact={true} />
            <RaiseIssueButton userName={displayName} />
            <LeadApprovalReqButton userName={displayName} />
            <NotifBell count={notif.total} onClick={() => setShowNotif((s) => !s)} />
          </div>
        </div>
        <div className="stat-grid">
          <StatCard label="Team Progress" value={`${avgPct}%`} sub={"avg across " + team.length + " member" + (team.length === 1 ? "" : "s")} color="var(--ink)" />
          <StatCard label="Open Issues" value={String(openIssueCount)} sub="need attention" color="var(--red)" />
          <StatCard label="Pending Approvals" value={String(pendingApprovalCount)} sub="awaiting client" color="var(--amber)" />
          <StatCard label="Assigned Requests" value={String(leads.length)} sub="from admin" color="var(--green)" />
        </div>
        {tab === "Overview" && <TeamOverviewTab />}
        {tab === "My Team" && <MyTeamTab />}
        {tab === "Issues" && <IssuesTab />}
        {tab === "RFIs" && <RFIsTab extraCol={true} />}
        {tab === "Requests" && <AssignedRequestsTab />}
        {tab === "Tasks" && <LeadTasksTab />}
      </Main>
    </div>
  );
}
