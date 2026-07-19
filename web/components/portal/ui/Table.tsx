import type { ReactNode } from "react";

/**
 * Grid templates mix fixed px columns with `fr` columns (e.g.
 * "90px 1.2fr 1.6fr 1fr 90px 110px 100px"). `minWidth: max-content` was
 * tried first to stop narrow viewports from crushing columns, but that
 * forces text-heavy `fr` columns (e.g. a full sentence in a Description
 * column) to their *unwrapped* width — ballooning a single row past 2000px
 * instead of wrapping text within a reasonable column. This instead gives
 * each `fr` unit a sane floor (a normal readable column width) so the grid
 * has a sensible minimum: text still wraps within each column, and the
 * table only needs to scroll roughly as wide as it visually should.
 */
const FR_BASE_PX = 130;

function resolveMinWidth(tpl: string): string {
  const total = tpl
    .trim()
    .split(/\s+/)
    .reduce((sum, token) => {
      const px = token.match(/^([\d.]+)px$/);
      if (px) return sum + parseFloat(px[1]);
      const fr = token.match(/^([\d.]+)fr$/);
      if (fr) return sum + parseFloat(fr[1]) * FR_BASE_PX;
      return sum;
    }, 0);
  return `${total}px`;
}

export function THead({ cols, tpl }: { cols: string[]; tpl: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: tpl,
        minWidth: resolveMinWidth(tpl),
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
        minWidth: resolveMinWidth(tpl),
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
      {/* Tables use fixed-px + fr grid columns sized for desktop; on narrow
          screens those columns were being crushed instead of respected
          (columns cut off, text wrapping into unreadably tall cells).
          Scrolling horizontally here preserves the intended column widths. */}
      <div style={{ overflowX: "auto" }}>{children}</div>
    </div>
  );
}
