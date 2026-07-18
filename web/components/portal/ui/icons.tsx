export function LOD({ v }: { v: string }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-instrument-sans),sans-serif",
        color: "#171717",
        fontWeight: 600,
        fontSize: 13,
      }}
    >
      {v}
    </span>
  );
}

const DEL_ICON_MAP: Record<string, string> = {
  Model: "◈",
  Drawings: "▦",
  Report: "≡",
  RFI: "⊕",
};

const DEL_ICON_COLOR: Record<string, string> = {
  Model: "#171717",
  Drawings: "#7C3AED",
  Report: "#B7770D",
  RFI: "#1A7A4A",
};

export function DelIcon({ type }: { type: string }) {
  return (
    <span
      style={{
        fontSize: 14,
        color: DEL_ICON_COLOR[type] || "#5C594F",
      }}
    >
      {DEL_ICON_MAP[type] || "◈"}
    </span>
  );
}

interface IconProps {
  size?: number;
  color?: string;
}

export function CamIcon({ size = 16, color = "#fff" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 7l-7 5 7 5V7z" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

export function WarnIcon({ size = 16, color = "#fff" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function PhasePill({ p }: { p: string }) {
  return (
    <span
      style={{
        background: "#F2F0EA",
        color: "#171717",
        padding: "3px 10px",
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {p}
    </span>
  );
}
