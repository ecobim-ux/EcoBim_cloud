"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchRfis, type ApiRfi } from "@/lib/portal/rfis";
import { fetchMyProject, type ApiMyProject } from "@/lib/portal/projects";
import { initials } from "@/lib/portal/helpers";
import { CommandPalette } from "../layout/CommandPalette";
import { Main } from "../layout/Main";
import { MobileTopBar } from "../layout/MobileTopBar";
import { NotifBell } from "../layout/NotifBell";
import { SearchBtn } from "../layout/SearchBtn";
import { Sidebar } from "../layout/Sidebar";
import { useCollapse } from "../layout/useCollapse";
import { useNotifications } from "../layout/useNotifications";
import { UpcomingMeetings } from "../shared/UpcomingMeetings";
import { NotifPopup } from "../ui/NotifPopup";
import { RoleTag } from "../ui/RoleTag";
import { StatCard } from "../ui/StatCard";
import { PhasePill } from "../ui/icons";
import { ClientDocsTab } from "./ClientDocsTab";
import { ClientMilestonesTab } from "./ClientMilestonesTab";
import { ClientRFIsTab } from "./ClientRFIsTab";
import { ClientStatusTab } from "./ClientStatusTab";

interface ClientPortalProps {
  onSwitch: () => void;
  initialTab: string | null;
  showToast: (msg: string, type?: import("../ui/Toast").ToastType) => void;
  userName: string;
}

export function ClientPortal({ onSwitch, initialTab, userName }: ClientPortalProps) {
  const [tab, setTab] = useState(initialTab || "Project Status");
  const [showNotif, setShowNotif] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [collapsed, toggleCollapse] = useCollapse();
  const [mobOpen, setMobOpen] = useState(false);
  const [rfis, setRfis] = useState<ApiRfi[]>([]);
  const [project, setProject] = useState<ApiMyProject | null>(null);

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  const loadRfis = useCallback(() => {
    fetchRfis().then(setRfis);
  }, []);

  useEffect(() => {
    loadRfis();
  }, [loadRfis]);

  useEffect(() => {
    fetchMyProject().then(setProject);
  }, []);

  const notif = useNotifications();
  const tabs = ["Project Status", "Milestones & Approvals", "Documents", "RFIs"];
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
        role="client"
        open={showSearch}
        onClose={() => setShowSearch(false)}
        onNav={(t) => {
          setShowSearch(false);
          setTab(t);
        }}
        onAction={() => setShowSearch(false)}
      />
      <MobileTopBar onMenuOpen={() => setMobOpen(true)} userName={displayName} role="Client" />
      <Sidebar
        tabs={tabs}
        active={tab}
        setTab={setTab}
        role="Client"
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
                {displayName} <RoleTag role="client" />
              </h1>
              {project?.currentPhaseCode && <PhasePill p={project.currentPhaseCode} />}
            </div>
            <div style={{ fontSize: 13, color: "#8A867C" }}>{project ? project.name + " · Active project" : "No active project yet"}</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <SearchBtn onClick={() => setShowSearch(true)} />
            <NotifBell count={notif.total} onClick={() => setShowNotif((s) => !s)} />
          </div>
        </div>
        <div className="stat-grid">
          <StatCard label="Overall Progress" value={project ? project.overallProgress + "%" : "—"} sub={project?.currentPhaseLabel ? project.currentPhaseLabel + " phase" : "No project yet"} color="var(--ink)" />
          <StatCard label="Phases Complete" value={project ? project.phasesComplete + "/" + project.phasesTotal : "—"} sub="on schedule" color="var(--green)" />
          <StatCard label="Awaiting Approval" value={String(project?.pendingApprovals ?? 0)} sub="pending review" color="var(--amber)" />
          <StatCard label="Open RFIs" value={String(rfis.filter((r) => r.status === "Pending").length)} sub="response due" color="var(--red)" />
        </div>
        <UpcomingMeetings />
        {tab === "Project Status" && <ClientStatusTab project={project} userName={displayName} />}
        {tab === "Milestones & Approvals" && <ClientMilestonesTab userName={displayName} />}
        {tab === "Documents" && <ClientDocsTab />}
        {tab === "RFIs" && <ClientRFIsTab />}
      </Main>
    </div>
  );
}
