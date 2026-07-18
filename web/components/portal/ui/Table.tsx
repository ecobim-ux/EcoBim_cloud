import type { ReactNode } from "react";

export function THead({ cols, tpl }: { cols: string[]; tpl: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: tpl,
        background: "#F6F4EF",
        borderBottom: "1px solid #E5E2DA",
        padding: "10px 20px",
        fontSize: 11,
        fontWeight: 600,
        color: "#8A867C",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        gap: 12,
      }}
    >
      {cols.map((c) => (
        <span key={c}>{c}</span>
      ))}
    </div>
  );
}

interface TRowProps {
  tpl: string;
  children?: ReactNode;
  onClick?: () => void;
}

export function TRow({ tpl, children, onClick }: TRowProps) {
  return (
    <div
      className={onClick ? "trow" : ""}
      style={{
        display: "grid",
        gridTemplateColumns: tpl,
        padding: "13px 20px",
        borderBottom: "1px solid #F2F0EA",
        alignItems: "center",
        gap: 12,
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function TableWrap({ children }: { children?: ReactNode }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #E5E2DA",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}
