"use client";

import Link from "next/link";
import { useState } from "react";
import { CREDENTIALS } from "@/lib/portal/auth";
import { FloatingPaths } from "./FloatingPaths";

export function LoginPage({ onLogin }: { onLogin: (role: string, name: string) => void }) {
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

  return (
    <div className="login-grid" style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", background: "#FAF9F6" }}>
      <div className="login-left" style={{ background: "#171717", color: "#FAF9F6", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "48px 56px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-0.01em", fontFamily: "var(--font-newsreader), Georgia, serif" }}>
            <span style={{ color: "#FF5949", fontStyle: "italic" }}>Eco</span>BIM
          </span>
          <span style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(250,249,246,.4)", marginLeft: 4 }}>
            Portal
          </span>
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: "clamp(32px,3.6vw,52px)", lineHeight: 1.06, letterSpacing: "-0.02em", fontWeight: 300, fontFamily: "var(--font-newsreader),Georgia,serif", color: "#FAF9F6", marginBottom: 20 }}>
            Model first.
            <br />
            <span style={{ fontStyle: "italic" }}>Build once.</span>
          </div>
          <p style={{ fontSize: 13.5, lineHeight: 1.75, color: "rgba(250,249,246,.6)", maxWidth: "28em", margin: 0 }}>
            One place for tasks, models, RFIs and approvals — for the whole team and for our clients.
          </p>
        </div>
        <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 28, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(250,249,246,.35)", flexWrap: "wrap" }}>
          <span>ISO 19650</span>
          <span>LOD 100–400</span>
          <span>COBie</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "72px 32px", position: "relative", minHeight: "100vh" }}>
        <div
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.5 }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 560,
              height: 320,
              background: "radial-gradient(ellipse at 55% 32%,rgba(23,23,23,.07) 0,rgba(140,140,140,.02) 50%,transparent 80%)",
              borderRadius: "50%",
              transform: "translateY(-35%)",
            }}
          />
        </div>
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
        <div style={{ width: "100%", maxWidth: 390, position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
            <span style={{ fontSize: 17, fontWeight: 500, letterSpacing: "-0.01em", color: "#171717", fontFamily: "var(--font-newsreader), Georgia, serif" }}>
              <span style={{ color: "#FF5949", fontStyle: "italic" }}>Eco</span>BIM
            </span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#171717", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            Sign in or join now.
          </h1>
          <p style={{ fontSize: 14, color: "#8A867C", marginTop: 8, marginBottom: 32, lineHeight: 1.5 }}>
            Use your portal credentials to continue.
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
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 40px",
                  border: "1px solid " + (err ? "#C0392B" : "rgba(23,23,23,.18)"),
                  borderRadius: 10,
                  fontSize: 15,
                  background: "#fff",
                  color: "#171717",
                  transition: "border-color .15s",
                  boxSizing: "border-box",
                }}
              />
              <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8A867C", pointerEvents: "none" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M20 21a8 8 0 10-16 0" />
              </svg>
            </div>
          </div>
          <div style={{ marginBottom: err ? 10 : 24 }}>
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
                style={{
                  width: "100%",
                  padding: "12px 52px 12px 40px",
                  border: "1px solid " + (err ? "#C0392B" : "rgba(23,23,23,.18)"),
                  borderRadius: 10,
                  fontSize: 15,
                  background: "#fff",
                  color: "#171717",
                  transition: "border-color .15s",
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
            style={{
              width: "100%",
              padding: "14px",
              background: loading || !uid || !pw ? "rgba(23,23,23,.2)" : "#171717",
              color: "#FAF9F6",
              border: "none",
              fontSize: 12,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              fontWeight: 500,
              cursor: loading || !uid || !pw ? "not-allowed" : "pointer",
              transition: "background .15s",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {loading && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#FAF9F6" style={{ animation: "lp-spin 1s linear infinite" }} aria-hidden="true">
                <path d="M12 2a10 10 0 0110 10h-2.5a7.5 7.5 0 00-7.5-7.5V2z" />
              </svg>
            )}
            {loading ? "Signing in…" : "Continue"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(23,23,23,.1)" }} />
            <span style={{ fontSize: 10, color: "#8A867C", letterSpacing: ".1em", textTransform: "uppercase" }}>
              Quick access
            </span>
            <div style={{ flex: 1, height: 1, background: "rgba(23,23,23,.1)" }} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#8A867C", fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6, opacity: 0.4 }}>
              Demo credentials — click to fill
            </div>
            <div style={{ border: "1px solid #E5E2DA", borderRadius: 10, overflow: "hidden", opacity: 0.4 }}>
              {CREDENTIALS.map((c, i) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setUid(c.id);
                    setPw(c.pass);
                    setErr("");
                  }}
                  className="trow"
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "11px 14px", borderTop: i === 0 ? "none" : "1px solid #E5E2DA", cursor: "pointer", background: "#fff", transition: "background .12s" }}
                >
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#171717" }}>{c.display}</span>
                  <span style={{ fontSize: 11, color: "#8A867C", fontFamily: "monospace", letterSpacing: ".02em" }}>
                    {c.id} · {c.pass}
                  </span>
                </div>
              ))}
            </div>
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
      </div>
    </div>
  );
}
