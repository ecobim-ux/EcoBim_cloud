import type { CSSProperties } from "react";

/* ═══ SHARED DESIGN TOKENS ═══
   Ported verbatim from portal.html's shared inline-style objects, reused
   across many tabs/forms/cards in the portal. */

export const fldS: CSSProperties = {
  width: "100%",
  border: "1px solid #E5E2DA",
  borderRadius: 10,
  padding: "9px 11px",
  fontSize: 13,
  background: "#fff",
  color: "#171717",
};

export const labS: CSSProperties = {
  display: "block",
  fontSize: 11,
  color: "#8A867C",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 6,
  fontWeight: 600,
};

export const subPill = (active: boolean): CSSProperties => ({
  fontSize: 12.5,
  fontWeight: 600,
  letterSpacing: "0.01em",
  padding: "8px 16px",
  borderRadius: 20,
  border: active ? "none" : "1px solid #E5E2DA",
  background: active ? "#171717" : "#fff",
  color: active ? "#fff" : "#5C594F",
  cursor: "pointer",
  transition: "all .15s",
  whiteSpace: "nowrap",
});

export const cardS: CSSProperties = {
  background: "#fff",
  border: "1px solid #E5E2DA",
  borderRadius: 12,
  padding: "20px 22px",
  marginBottom: 22,
};

export const secTitle: CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  marginBottom: 4,
};

export const secSub: CSSProperties = {
  fontSize: 12.5,
  color: "#8A867C",
  marginBottom: 16,
  maxWidth: 620,
};
