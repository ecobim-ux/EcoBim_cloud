"use client";

import { Fragment, useEffect, useState } from "react";
import { useToast } from "./ui/Toast";
import { LoginPage } from "./login/LoginPage";
import { EmployeeDashboard } from "./employee/EmployeeDashboard";
import { TeamLeadDashboard } from "./team-lead/TeamLeadDashboard";
import { AdminDashboard } from "./admin/AdminDashboard";
import { ClientPortal } from "./client/ClientPortal";
import { CustomCursor } from "./CustomCursor";

export function PortalApp() {
  const [role, setRole] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [navTab, setNavTab] = useState<string | null>(null);
  const { show: showToast, ToastHost } = useToast();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json() as Promise<{ session: { role: string; name: string } | null }>)
      .then((data) => {
        if (data.session) setRole(data.session.role);
      })
      .catch(() => {
        /* not logged in / API unreachable — stays on login page */
      })
      .finally(() => setCheckingSession(false));
  }, []);

  const handleLogin = (r: string) => {
    setRole(r);
    setNavTab(null);
  };

  const back = () => {
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {
      /* best-effort — clear client state regardless */
    });
    setRole(null);
    setNavTab(null);
  };

  const skip = (
    <a className="portal-skip" href="#portal-main">
      Skip to main content
    </a>
  );

  if (checkingSession) return <div className="portal-root" />;

  return (
    <div className="portal-root">
      {!role && <LoginPage onLogin={handleLogin} />}
      {role === "employee" && (
        <Fragment>
          {skip}
          <EmployeeDashboard onSwitch={back} initialTab={navTab} showToast={showToast} />
        </Fragment>
      )}
      {role === "teamlead" && (
        <Fragment>
          {skip}
          <TeamLeadDashboard onSwitch={back} initialTab={navTab} showToast={showToast} />
        </Fragment>
      )}
      {role === "admin" && (
        <Fragment>
          {skip}
          <AdminDashboard onSwitch={back} initialTab={navTab} showToast={showToast} />
        </Fragment>
      )}
      {role === "client" && <ClientPortal onSwitch={back} initialTab={navTab} showToast={showToast} />}
      <ToastHost />
      <CustomCursor />
    </div>
  );
}
