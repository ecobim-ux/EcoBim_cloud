"use client";

import { Fragment, useState } from "react";
import { useToast } from "./ui/Toast";
import { LoginPage } from "./login/LoginPage";
import { EmployeeDashboard } from "./employee/EmployeeDashboard";
import { TeamLeadDashboard } from "./team-lead/TeamLeadDashboard";
import { AdminDashboard } from "./admin/AdminDashboard";
import { ClientPortal } from "./client/ClientPortal";
import { CustomCursor } from "./CustomCursor";

export function PortalApp() {
  const [role, setRole] = useState<string | null>(null);
  const [navTab, setNavTab] = useState<string | null>(null);
  const { show: showToast, ToastHost } = useToast();

  const handleLogin = (r: string) => {
    setRole(r);
    setNavTab(null);
  };

  const back = () => {
    setRole(null);
    setNavTab(null);
  };

  const skip = (
    <a className="portal-skip" href="#portal-main">
      Skip to main content
    </a>
  );

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
