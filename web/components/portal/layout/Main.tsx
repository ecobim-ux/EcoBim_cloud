import type { ReactNode } from "react";

export function Main({ children, collapsed }: { children?: ReactNode; collapsed: boolean }) {
  return (
    <main
      id="portal-main"
      className="portal-main"
      role="main"
      style={{
        marginLeft: collapsed ? 74 : 230,
        padding: "40px 44px",
        background: "#FAF9F6",
        minHeight: "100vh",
        flex: 1,
        minWidth: 0,
        transition: "margin-left .18s ease",
      }}
    >
      {children}
    </main>
  );
}
