"use client";

import Link from "next/link";
import { Fragment } from "react";
import { ROLE_LABEL_TO_KEY } from "@/lib/portal/helpers";
import { Avi } from "../ui/Avi";
import { NavIcon } from "./NavIcon";

interface SidebarProps {
  tabs: string[];
  active: string;
  setTab: (t: string) => void;
  role: string;
  userName: string;
  userIni: string;
  onSwitch: () => void;
  notifCounts?: Record<string, number>;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobOpen: boolean;
  onMobClose?: () => void;
}

export function Sidebar({
  tabs,
  active,
  setTab,
  role,
  userName,
  userIni,
  onSwitch,
  notifCounts = {},
  collapsed,
  onToggleCollapse,
  mobOpen,
  onMobClose,
}: SidebarProps) {
  const W = collapsed ? 74 : 230;
  const chevron = (dir: "left" | "right") => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {dir === "left" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
    </svg>
  );
  return (
    <Fragment>
      {mobOpen && <div className="sidebar-overlay open" onClick={onMobClose} aria-hidden="true" />}
      <nav
        className={"portal-sidebar" + (mobOpen ? " mob-open" : "")}
        aria-label="Portal navigation"
        style={{
          width: W,
          background: "#FAF9F6",
          borderRight: "1px solid #E5E2DA",
          position: "fixed",
          height: "100vh",
          top: 0,
          left: 0,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          transition: "width .18s ease, transform .22s ease",
        }}
      >
        <div
          style={{
            padding: collapsed ? "20px 0 16px" : "22px 18px 16px",
            borderBottom: "1px solid #E5E2DA",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            gap: 8,
          }}
        >
          {collapsed ? (
            <div
              style={{ width: 30, height: 30, borderRadius: 9, background: "#171717", color: "#FAF9F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 600 }}
              aria-label="EcoBIM"
            >
              E
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 17, fontWeight: 500, letterSpacing: "-0.01em", color: "#171717", fontFamily: "var(--font-newsreader), Georgia, serif" }}>
                <span style={{ color: "#FF5949", fontStyle: "italic" }}>Eco</span>BIM
              </div>
              <div style={{ fontSize: 9.5, color: "#8A867C", letterSpacing: "0.14em", marginTop: 3, textTransform: "uppercase" }}>
                Project Portal
              </div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={onToggleCollapse}
              className="nav-i"
              aria-label="Collapse sidebar"
              style={{ background: "none", border: "none", color: "#8A867C", padding: 6, borderRadius: 9, display: "flex", alignItems: "center", minWidth: 32, minHeight: 32 }}
            >
              {chevron("left")}
            </button>
          )}
        </div>
        {collapsed && (
          <button
            onClick={onToggleCollapse}
            className="nav-i"
            aria-label="Expand sidebar"
            style={{ background: "none", border: "none", color: "#8A867C", padding: "10px 0", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid #E5E2DA", minHeight: 40 }}
          >
            {chevron("right")}
          </button>
        )}
        {!collapsed && (
          <div style={{ padding: "12px 18px 8px", fontSize: 10, color: "#8A867C", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, borderBottom: "1px solid #E5E2DA" }}>
            {role}
          </div>
        )}
        <div style={{ flex: 1, padding: collapsed ? "10px 8px" : "10px", overflowY: "auto", overflowX: "hidden" }}>
          {tabs.map((t) => {
            const on = active === t;
            const badge = notifCounts[t] || 0;
            return (
              <button
                key={t}
                className="nav-i"
                onClick={() => {
                  setTab(t);
                  if (onMobClose) onMobClose();
                }}
                aria-label={t}
                aria-current={on ? "page" : undefined}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: collapsed ? 0 : 10,
                  justifyContent: collapsed ? "center" : "flex-start",
                  paddingTop: 11,
                  paddingBottom: 11,
                  paddingLeft: collapsed ? 0 : on ? 9 : 11,
                  paddingRight: collapsed ? 0 : 11,
                  borderRadius: 10,
                  fontSize: 11,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  width: "100%",
                  textAlign: "left",
                  marginBottom: 2,
                  background: on ? "#EFEFEB" : "transparent",
                  color: on ? "#171717" : "#8A867C",
                  fontWeight: on ? 600 : 500,
                  border: "none",
                  transition: "background .12s,color .12s",
                  minHeight: 40,
                  borderLeft: on && !collapsed ? "2px solid #171717" : "2px solid transparent",
                }}
              >
                <span style={{ opacity: on ? 1 : 0.6, transition: "opacity .12s", display: "flex", alignItems: "center", flexShrink: 0 }}>
                  <NavIcon name={t} size={15} color={on ? "#171717" : "#8A867C"} />
                </span>
                {!collapsed && <span style={{ flex: 1, lineHeight: 1.2 }}>{t}</span>}
                {!collapsed && badge > 0 && (
                  <span style={{ background: "#C0392B", color: "#fff", borderRadius: 12, fontSize: 9.5, fontWeight: 700, padding: "1px 6px", minWidth: 16, textAlign: "center", lineHeight: "1.7" }}>
                    {badge}
                  </span>
                )}
                {collapsed && badge > 0 && (
                  <span
                    className="notif-badge-pulse"
                    style={{ position: "absolute", top: 6, right: 9, background: "#C0392B", width: 8, height: 8, borderRadius: "50%" }}
                    aria-label={badge + " notifications"}
                  />
                )}
              </button>
            );
          })}
        </div>
        <div style={{ padding: collapsed ? "12px 8px" : "12px 14px", borderTop: "1px solid #E5E2DA", display: "flex", flexDirection: "column", gap: 8, alignItems: collapsed ? "center" : "stretch" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: collapsed ? "center" : "flex-start" }}>
            <Avi ini={userIni} role={ROLE_LABEL_TO_KEY[role]} />
            {!collapsed && (
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.3 }}>{userName}</div>
                <div style={{ fontSize: 10.5, color: "#8A867C" }}>{role}</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <Link
              href="/"
              style={{
                width: "100%",
                background: "transparent",
                color: "#8A867C",
                border: "1px solid #E5E2DA",
                padding: "7px 10px",
                borderRadius: 10,
                fontSize: 11.5,
                fontWeight: 500,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                transition: "background .15s,color .15s",
                letterSpacing: ".02em",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Website
            </Link>
          )}
          <button
            className="btn-s"
            aria-label="Log out"
            style={{ width: "100%", background: "transparent", color: "#171717", border: "1px solid #E5E2DA", padding: "7px 10px", borderRadius: 10, fontSize: 11.5, fontWeight: 500, transition: "background .15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, minHeight: 36 }}
            onClick={onSwitch}
          >
            {collapsed ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            ) : (
              <Fragment>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Log out
              </Fragment>
            )}
          </button>
          {!collapsed && (
            <button
              aria-label="Log out on every device"
              style={{ width: "100%", background: "none", color: "#8A867C", border: "none", padding: "4px 4px 0", fontSize: 10.5, fontWeight: 500, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2 }}
              onClick={() => {
                fetch("/api/auth/logout-everywhere", { method: "POST" }).catch(() => {
                  /* best-effort — client state clears via onSwitch regardless */
                });
                onSwitch();
              }}
            >
              Log out everywhere
            </button>
          )}
        </div>
      </nav>
    </Fragment>
  );
}
