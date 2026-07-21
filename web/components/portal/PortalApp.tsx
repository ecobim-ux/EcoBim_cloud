"use client";

import { Fragment, useEffect, useState } from "react";
import { useToast } from "./ui/Toast";
import { LoginPage } from "./login/LoginPage";
import { EmployeeDashboard } from "./employee/EmployeeDashboard";
import { TeamLeadDashboard } from "./team-lead/TeamLeadDashboard";
import { AdminDashboard } from "./admin/AdminDashboard";
import { ClientPortal } from "./client/ClientPortal";
import { CustomCursor } from "./CustomCursor";
import { PeopleProvider } from "./PeopleProvider";
import { useIdleLogout } from "./layout/useIdleLogout";

export function PortalApp() {
  const [role, setRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [navTab, setNavTab] = useState<string | null>(null);
  const { show: showToast, ToastHost } = useToast();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json() as Promise<{ session: { role: string; name: string } | null }>)
      .then((data) => {
        if (data.session) {
          setRole(data.session.role);
          setUserName(data.session.name);
        }
      })
      .catch(() => {
        /* not logged in / API unreachable — stays on login page */
      })
      .finally(() => setCheckingSession(false));
  }, []);

  const handleLogin = (r: string, name: string) => {
    setRole(r);
    setUserName(name);
    setNavTab(null);
  };

  const back = () => {
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {
      /* best-effort — clear client state regardless */
    });
    setRole(null);
    setNavTab(null);
  };

  useIdleLogout(!!role, () => {
    back();
    showToast("Signed out after 30 minutes of inactivity.", "info");
  });

  const skip = (
    <a className="portal-skip" href="#portal-main">
      Skip to main content
    </a>
  );

  if (checkingSession) return <div className="portal-root" />;

  return (
    <div className="portal-root">
      {!role && <LoginPage onLogin={handleLogin} />}
      {(role === "employee" || role === "teamlead" || role === "admin") && (
        <PeopleProvider>
          {role === "employee" && (
            <Fragment>
              {skip}
              <EmployeeDashboard onSwitch={back} initialTab={navTab} showToast={showToast} userName={userName} />
            </Fragment>
          )}
          {role === "teamlead" && (
            <Fragment>
              {skip}
              <TeamLeadDashboard onSwitch={back} initialTab={navTab} showToast={showToast} userName={userName} />
            </Fragment>
          )}
          {role === "admin" && (
            <Fragment>
              {skip}
              <AdminDashboard onSwitch={back} initialTab={navTab} showToast={showToast} userName={userName} />
            </Fragment>
          )}
        </PeopleProvider>
      )}
      {role === "client" && <ClientPortal onSwitch={back} initialTab={navTab} showToast={showToast} userName={userName} />}
      <ToastHost />
      <CustomCursor />
    </div>
  );
}
