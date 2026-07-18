import type { Metadata, Viewport } from "next";
import { instrumentSans, jetbrainsMono, newsreader } from "./fonts";
import { PortalApp } from "@/components/portal/PortalApp";
import "./portal.css";

export const metadata: Metadata = {
  title: "EcoBIM — Project Portal | Client & Team Login",
  description: "EcoBIM secure project portal — role-based dashboards for clients, team leads, employees and admins managing BIM coordination projects.",
  robots: "noindex, nofollow",
  alternates: { canonical: "https://ecobim.co/portal" },
  icons: { icon: "/favicon.svg", apple: "/favicon.svg" },
  referrer: "strict-origin-when-cross-origin",
};

export const viewport: Viewport = {
  themeColor: "#171717",
};

export default function PortalPage() {
  return (
    <div className={`${instrumentSans.variable} ${jetbrainsMono.variable} ${newsreader.variable}`}>
      <PortalApp />
    </div>
  );
}
