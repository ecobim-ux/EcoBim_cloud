"use client";

import Link from "next/link";
import { useState } from "react";
import { ROLE_CFG } from "../ui/RoleTag";
import { POS_ORDER, POS_LABEL } from "@/lib/portal/people";
import { FloatingPaths } from "./FloatingPaths";

const FEATURE_TAGS = ["ISO 19650", "LOD 100–400", "COBie"];

const ROLE_DESC: Record<string, string> = {
  admin: "Oversee every project, team, and client account.",
  teamlead: "Coordinate your team's tasks, issues, and approvals.",
  employee: "Track your tasks, log time, and raise issues.",
  client: "Review milestones, approve work, and stay updated.",
};

export function LoginPage({ onLogin }: { onLogin: (role: string, name: string) => void }) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [uid, setUid] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const attempt = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId: uid.trim(), password: pw }),
      });
      const data = (await res.json()) as { role?: string; name?: string; error?: string };
      if (res.ok && data.role && data.name) {
        onLogin(data.role, data.name);
      } else {
        setErr(data.error || "Incorrect ID or password. Please try again.");
      }
    } catch {
      setErr("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") attempt();
  };

  const changeRole = () => {
    setSelectedRole(null);
    setUid("");
    setPw("");
    setErr("");
  };

  const rise = (delay: number): React.CSSProperties => ({ animation: "portal-rise .7s var(--ease) both", animationDelay: `${delay}s` });

  const roleLabel = selectedRole ? POS_LABEL[selectedRole] : "";
  const roleCfg = selectedRole ? ROLE_CFG[selectedRole] : null;

  return (
    <div className="login-grid" style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", background: "#FAF9F6" }}>
      <div className="login-left" style={{ background: "#171717", color: "#FAF9F6", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "48px 56px", position: "relative", overflow: "hidden" }}>
        <div className="login-grid-pattern login-grid-pattern--dark" aria-hidden="true" />
        <div
          className="login-glow"
          aria-hidden="true"
          style={{ position: "absolute", top: "-16%", right: "-12%", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,89,73,.24) 0%, transparent 70%)", pointerEvents: "none" }}
        />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 10, ...rise(0) }}>
          <span style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-0.01em", fontFamily: "var(--font-newsreader), Georgia, serif" }}>
            <span style={{ color: "#FF5949", fontStyle: "italic" }}>Eco</span>BIM
          </span>
          <span style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(250,249,246,.4)", marginLeft: 4 }}>
            Portal
          </span>
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, ...rise(0.06) }}>
            <span style={{ width: 6, height: 6, background: "#FF5949", flexShrink: 0 }} />
            <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(250,249,246,.55)" }}>
              Project Portal
            </span>
          </div>
          <div style={{ fontSize: "clamp(32px,3.6vw,52px)", lineHeight: 1.06, letterSpacing: "-0.02em", fontWeight: 300, fontFamily: "var(--font-newsreader),Georgia,serif", color: "#FAF9F6", marginBottom: 20, ...rise(0.12) }}>
            Model first.
            <br />
            <span style={{ fontStyle: "italic" }}>Build once.</span>
          </div>
          <p style={{ fontSize: 13.5, lineHeight: 1.75, color: "rgba(250,249,246,.6)", maxWidth: "28em", margin: 0, ...rise(0.18) }}>
            One place for tasks, models, RFIs and approvals — for the whole team and for our clients.
          </p>
        </div>
        <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 24, flexWrap: "wrap", ...rise(0.24) }}>
          {FEATURE_TAGS.map((tag) => (
            <span key={tag} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(250,249,246,.4)", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,89,73,.7)", flexShrink: 0 }} />
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "72px 32px", position: "relative", minHeight: "100vh" }}>
        <div className="login-grid-pattern" aria-hidden="true" />
        <Link
          href="/"
          style={{
            position: "absolute",
            top: 28,
            right: 20,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#8A867C",
            textDecoration: "none",
            fontWeight: 500,
            padding: "8px 12px",
            borderRadius: 8,
            zIndex: 1,
          }}
          className="btn-home-link"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to website
        </Link>

        {selectedRole === null ? (
          <div
            key="role-step"
            className="login-card"
            style={{
              width: "100%",
              maxWidth: 420,
              position: "relative",
              zIndex: 1,
              background: "#fff",
              border: "1px solid rgba(23,23,23,.08)",
              borderRadius: 18,
              padding: "40px 36px",
              boxShadow: "0 30px 70px -30px rgba(23,23,23,.22)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 18 }}>
              <span style={{ width: 6, height: 6, background: "#FF5949", flexShrink: 0 }} />
              <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8A867C" }}>
                Portal Access
              </span>
            </div>
            <h1 style={{ fontSize: 25, fontWeight: 700, color: "#171717", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              Where would you like to sign in?
            </h1>
            <p style={{ fontSize: 14, color: "#8A867C", marginTop: 8, marginBottom: 24, lineHeight: 1.5 }}>
              Choose your role to continue.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {POS_ORDER.map((key, i) => {
                const cfg = ROLE_CFG[key];
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedRole(key)}
                    className="role-card"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "14px 16px",
                      border: "1.5px solid rgba(23,23,23,.1)",
                      borderRadius: 14,
                      background: "#FAF9F6",
                      cursor: "pointer",
                      textAlign: "left",
                      width: "100%",
                      transition: "border-color .15s, transform .15s, box-shadow .15s, background .15s",
                      animation: "portal-rise .6s var(--ease) both",
                      animationDelay: `${0.05 + i * 0.05}s`,
                    }}
                  >
                    <span
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: cfg.bg,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 15,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {cfg.l}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#171717" }}>{POS_LABEL[key]}</span>
                      <span style={{ display: "block", fontSize: 11.5, color: "#8A867C", marginTop: 2, lineHeight: 1.4 }}>{ROLE_DESC[key]}</span>
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A867C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                      <polyline points="9 6 15 12 9 18" />
                    </svg>
                  </button>
                );
              })}
            </div>
            <p style={{ marginTop: 24, fontSize: 12, color: "#8A867C", lineHeight: 1.6, textAlign: "center" }}>
              By signing in you agree to our{" "}
              <a href="/terms" target="_blank" rel="noopener" style={{ color: "#171717", textDecoration: "underline", textUnderlineOffset: 3 }}>
                Terms
              </a>{" "}
              and{" "}
              <a href="/privacy" target="_blank" rel="noopener" style={{ color: "#171717", textDecoration: "underline", textUnderlineOffset: 3 }}>
                Privacy Policy
              </a>
              .
            </p>
          </div>
        ) : (
          <div
            key="creds-step"
            className="login-card"
            style={{
              width: "100%",
              maxWidth: 400,
              position: "relative",
              zIndex: 1,
              background: "#fff",
              border: "1px solid rgba(23,23,23,.08)",
              borderRadius: 18,
              padding: "40px 36px",
              boxShadow: "0 30px 70px -30px rgba(23,23,23,.22)",
            }}
          >
            <button
              onClick={changeRole}
              style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", padding: 0, marginBottom: 20, cursor: "pointer", color: "#8A867C", fontSize: 11.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Change role
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: roleCfg?.bg,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {roleCfg?.l}
              </span>
              <div>
                <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 9.5, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8A867C" }}>
                  Signing in as
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#171717", marginTop: 1 }}>{roleLabel}</div>
              </div>
            </div>
            <p style={{ fontSize: 14, color: "#8A867C", marginTop: 0, marginBottom: 26, lineHeight: 1.5 }}>
              Enter your portal credentials to continue.
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 10, fontWeight: 500, color: "#8A867C", letterSpacing: "0.14em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                User ID
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={uid}
                  onChange={(e) => {
                    setUid(e.target.value);
                    setErr("");
                  }}
                  onKeyDown={onKey}
                  placeholder="Enter your user ID"
                  className="login-input"
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "13px 12px 13px 40px",
                    border: "1.5px solid " + (err ? "#C0392B" : "rgba(23,23,23,.14)"),
                    borderRadius: 11,
                    fontSize: 15,
                    background: "#FAF9F6",
                    color: "#171717",
                    transition: "border-color .15s, box-shadow .15s",
                    boxSizing: "border-box",
                  }}
                />
                <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8A867C", pointerEvents: "none" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M20 21a8 8 0 10-16 0" />
                </svg>
              </div>
            </div>
            <div style={{ marginBottom: err ? 10 : 26 }}>
              <label style={{ fontSize: 10, fontWeight: 500, color: "#8A867C", letterSpacing: "0.14em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={pw}
                  onChange={(e) => {
                    setPw(e.target.value);
                    setErr("");
                  }}
                  onKeyDown={onKey}
                  placeholder="Enter your password"
                  className="login-input"
                  style={{
                    width: "100%",
                    padding: "13px 52px 13px 40px",
                    border: "1.5px solid " + (err ? "#C0392B" : "rgba(23,23,23,.14)"),
                    borderRadius: 11,
                    fontSize: 15,
                    background: "#FAF9F6",
                    color: "#171717",
                    transition: "border-color .15s, box-shadow .15s",
                    boxSizing: "border-box",
                  }}
                />
                <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8A867C", pointerEvents: "none" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <button
                  onClick={() => setShowPw((s) => !s)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#8A867C", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500, cursor: "pointer", padding: 4 }}
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            {err && (
              <div style={{ fontSize: 13, color: "#C0392B", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                {err}
              </div>
            )}
            <button
              onClick={attempt}
              disabled={loading || !uid || !pw}
              className="login-cta"
              style={{
                width: "100%",
                padding: "14px",
                background: loading || !uid || !pw ? "rgba(23,23,23,.18)" : "#FF5949",
                color: "#fff",
                border: "none",
                fontSize: 12,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                fontWeight: 600,
                cursor: loading || !uid || !pw ? "not-allowed" : "pointer",
                transition: "background .15s",
                borderRadius: 11,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {loading && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff" style={{ animation: "lp-spin 1s linear infinite" }} aria-hidden="true">
                  <path d="M12 2a10 10 0 0110 10h-2.5a7.5 7.5 0 00-7.5-7.5V2z" />
                </svg>
              )}
              {loading ? "Signing in…" : `Sign in as ${roleLabel}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
