"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { fldS } from "@/lib/portal/style-tokens";

const _MONTHS_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const _DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

interface DatePickerProps {
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  style?: CSSProperties;
  placeholder?: string;
  disabled?: boolean;
}

export function DatePicker({ value, onChange, style, placeholder = "Select date", disabled = false }: DatePickerProps) {
  const today = new Date();
  const parseISO = (v: string) => {
    if (!v) return null;
    const [y, m, d] = v.split("-").map(Number);
    return isNaN(y) ? null : { year: y, month: m - 1, day: d };
  };
  const sel = parseISO(value);
  const [open, setOpen] = useState(false);
  const [vY, setVY] = useState(sel ? sel.year : today.getFullYear());
  const [vM, setVM] = useState(sel ? sel.month : today.getMonth());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  /* sync view when value changes externally */
  useEffect(() => {
    const s = parseISO(value);
    if (s) {
      setVY(s.year);
      setVM(s.month);
    }
  }, [value]);

  const prevM = () => {
    if (vM === 0) {
      setVM(11);
      setVY((y) => y - 1);
    } else setVM((m) => m - 1);
  };
  const nextM = () => {
    if (vM === 11) {
      setVM(0);
      setVY((y) => y + 1);
    } else setVM((m) => m + 1);
  };
  const pick = (d: number) => {
    const iso = vY + "-" + String(vM + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
    onChange({ target: { value: iso } });
    setOpen(false);
  };
  const cells = () => {
    const first = new Date(vY, vM, 1).getDay();
    const dim = new Date(vY, vM + 1, 0).getDate();
    const out: (number | null)[] = [];
    for (let i = 0; i < first; i++) out.push(null);
    for (let d = 1; d <= dim; d++) out.push(d);
    return out;
  };
  const fmt = () => {
    if (!sel) return "";
    return String(sel.day).padStart(2, "0") + " " + _MONTHS_FULL[sel.month].slice(0, 3) + " " + sel.year;
  };
  const isToday = (d: number | null) => d === today.getDate() && vM === today.getMonth() && vY === today.getFullYear();
  const isSel = (d: number | null) => !!sel && d === sel.day && vM === sel.month && vY === sel.year;
  const calBtn: CSSProperties = {
    background: "none",
    border: "none",
    cursor: "pointer",
    borderRadius: 8,
    lineHeight: 1,
    padding: "5px 9px",
    color: "#8A867C",
    fontSize: 17,
    transition: "background .12s",
  };

  return (
    <div ref={ref} style={{ position: "relative", ...style }}>
      <div
        onClick={() => {
          if (!disabled) setOpen((o) => !o);
        }}
        style={{
          ...fldS,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: disabled ? "not-allowed" : "pointer",
          userSelect: "none",
          color: fmt() ? "#171717" : "#8A867C",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span style={{ fontSize: 13 }}>{fmt() || placeholder}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </div>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 600,
            background: "#fff",
            border: "1px solid #E5E2DA",
            borderRadius: 14,
            padding: "14px 12px 10px",
            boxShadow: "0 10px 36px rgba(23,23,23,.14)",
            minWidth: 268,
            fontFamily: "var(--font-instrument-sans),system-ui,sans-serif",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <button onClick={prevM} style={calBtn}>‹</button>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#171717" }}>
              {_MONTHS_FULL[vM]} {vY}
            </span>
            <button onClick={nextM} style={calBtn}>›</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
            {_DAYS_SHORT.map((d) => (
              <div key={d} style={{ textAlign: "center", fontSize: 10.5, fontWeight: 600, color: "#8A867C", padding: "2px 0" }}>
                {d}
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
            {cells().map((d, i) => (
              <button
                key={i}
                onClick={d ? () => pick(d) : undefined}
                style={{
                  background: isSel(d) ? "#171717" : isToday(d) ? "#F2F0EA" : "transparent",
                  color: isSel(d) ? "#fff" : isToday(d) ? "#171717" : "#5C594F",
                  border: isToday(d) && !isSel(d) ? "1.5px solid #D8D5CD" : "1px solid transparent",
                  borderRadius: 9,
                  padding: "7px 0",
                  fontSize: 12.5,
                  fontWeight: isSel(d) || isToday(d) ? 600 : 400,
                  cursor: d ? "pointer" : "default",
                  visibility: d ? "visible" : "hidden",
                  transition: "background .1s,color .1s",
                  fontFamily: "inherit",
                }}
              >
                {d || ""}
              </button>
            ))}
          </div>
          <div style={{ borderTop: "1px solid #F2F0EA", marginTop: 10, paddingTop: 8, textAlign: "center" }}>
            <button
              onClick={() => {
                setVY(today.getFullYear());
                setVM(today.getMonth());
                pick(today.getDate());
              }}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#8A867C", fontWeight: 500, fontFamily: "inherit" }}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
