"use client";

import { useEffect, useState } from "react";
import { RFIS } from "@/lib/portal/data";
import { getUnreadCounts, getUnreadTotal } from "@/lib/portal/storage";
import { CommandPalette } from "../layout/CommandPalette";
import { Main } from "../layout/Main";
import { MobileTopBar } from "../layout/MobileTopBar";
import { NotifBell } from "../layout/NotifBell";
import { SearchBtn } from "../layout/SearchBtn";
import { Sidebar } from "../layout/Sidebar";
import { useCollapse } from "../layout/useCollapse";
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
}

export function ClientPortal({ onSwitch, initialTab }: ClientPortalProps) {
  const [tab, setTab] = useState(initialTab || "Project Status");
  const [showNotif, setShowNotif] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [collapsed, toggleCollapse] = useCollapse();
  const [mobOpen, setMobOpen] = useState(false);

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  const notifCounts = getUnreadCounts("client");
  const tabs = ["Project Status", "Milestones & Approvals", "Documents", "RFIs"];
  const openRFIs = RFIS.filter((r) => ["RFI-014", "RFI-011"].includes(r.id) && r.status === "Pending").length;

  return (
    <div style={{ display: "flex" }}>
      {showNotif && (
        <NotifPopup
          role="client"
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
      <MobileTopBar onMenuOpen={() => setMobOpen(true)} userName="Dubai Marina Developments" role="Client" />
      <Sidebar
        tabs={tabs}
        active={tab}
        setTab={setTab}
        role="Client"
        userName="Dubai Marina Developments"
        userIni="DM"
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
                Dubai Marina Developments <RoleTag role="client" />
              </h1>
              <PhasePill p="CD" />
            </div>
            <div style={{ fontSize: 13, color: "#8A867C" }}>Dubai Marina Tower · Active project</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <SearchBtn onClick={() => setShowSearch(true)} />
            <NotifBell count={getUnreadTotal("client")} onClick={() => setShowNotif((s) => !s)} />
          </div>
        </div>
        <div className="stat-grid">
          <StatCard label="Overall Progress" value="68%" sub="Construction Docs phase" color="var(--ink)" />
          <StatCard label="Phases Complete" value="3/6" sub="on schedule" color="var(--green)" />
          <StatCard label="Awaiting Approval" value="1" sub="CD package" color="var(--amber)" />
          <StatCard label="Open RFIs" value={String(openRFIs)} sub="response due" color="var(--red)" />
        </div>
        {tab === "Project Status" && <ClientStatusTab />}
        {tab === "Milestones & Approvals" && <ClientMilestonesTab />}
        {tab === "Documents" && <ClientDocsTab />}
        {tab === "RFIs" && <ClientRFIsTab />}
      </Main>
    </div>
  );
}
