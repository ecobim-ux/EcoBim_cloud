"use client";

import { useEffect, useState } from "react";
import { ISSUES, TEAM } from "@/lib/portal/data";
import { getUnreadCounts, getUnreadTotal, readRequests } from "@/lib/portal/storage";
import { CommandPalette } from "../layout/CommandPalette";
import { Main } from "../layout/Main";
import { MobileTopBar } from "../layout/MobileTopBar";
import { NotifBell } from "../layout/NotifBell";
import { SearchBtn } from "../layout/SearchBtn";
import { Sidebar } from "../layout/Sidebar";
import { useCollapse } from "../layout/useCollapse";
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
}

export function TeamLeadDashboard({ onSwitch, initialTab }: TeamLeadDashboardProps) {
  const [tab, setTab] = useState(initialTab || "Overview");
  const [showNotif, setShowNotif] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [collapsed, toggleCollapse] = useCollapse();
  const [mobOpen, setMobOpen] = useState(false);

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  const notifCounts = getUnreadCounts("teamlead");
  const tabs = ["Overview", "My Team", "Issues", "RFIs", "Requests", "Tasks"];
  const myReqs = readRequests().filter((r) => r.assignedTo === "Pranav R.");
  const avgPct = Math.round(TEAM.reduce((a, t) => a + t.pct, 0) / TEAM.length);

  return (
    <div style={{ display: "flex" }}>
      {showNotif && (
        <NotifPopup
          role="teamlead"
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
      <MobileTopBar onMenuOpen={() => setMobOpen(true)} userName="Pranav R." role="Team Lead" />
      <Sidebar
        tabs={tabs}
        active={tab}
        setTab={setTab}
        role="Team Lead"
        userName="Pranav R."
        userIni="PR"
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
                Pranav R. <RoleTag role="teamlead" />
              </h1>
              <PhasePill p="Senior BIM Lead" />
            </div>
            <div style={{ fontSize: 13, color: "#8A867C" }}>Dubai Marina Tower · Active project</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <SearchBtn onClick={() => setShowSearch(true)} />
            <ScheduleMeetingButton role="teamlead" userName="Pranav R." compact={true} />
            <RaiseIssueButton />
            <LeadApprovalReqButton />
            <NotifBell count={getUnreadTotal("teamlead")} onClick={() => setShowNotif((s) => !s)} />
          </div>
        </div>
        <div className="stat-grid">
          <StatCard label="Team Progress" value={`${avgPct}%`} sub="avg across 4 members" color="var(--ink)" />
          <StatCard label="Open Issues" value={String(ISSUES.filter((i) => i.status !== "Closed").length)} sub="need attention" color="var(--red)" />
          <StatCard label="Pending Approvals" value="2" sub="awaiting client" color="var(--amber)" />
          <StatCard label="Assigned Requests" value={String(myReqs.length)} sub="from admin" color="var(--green)" />
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
