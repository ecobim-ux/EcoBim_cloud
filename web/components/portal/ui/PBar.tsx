interface PBarProps {
  pct: number;
  status?: string;
  label?: string;
}

export function PBar({ pct, status = "In Progress", label }: PBarProps) {
  const col =
    status === "Delayed"
      ? "var(--red)"
      : status === "Completed"
        ? "var(--green)"
        : status === "Not Started"
          ? "var(--ink-muted)"
          : "var(--ink)";
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ? `${label}: ${clamped}%` : `${status}: ${clamped}%`}
        style={{
          flex: 1,
          height: 5,
          background: "var(--paper-2)",
          borderRadius: 12,
          overflow: "hidden",
          minWidth: 60,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${clamped}%`,
            background: col,
            borderRadius: 12,
            transition: "width .5s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </div>
      <span
        className="num"
        style={{
          fontSize: 11,
          color: "var(--ink-muted)",
          minWidth: 28,
          textAlign: "right",
        }}
      >
        {clamped}%
      </span>
    </div>
  );
}
