interface DonutChartProps {
  pct: number;
  label?: string;
}

export function DonutChart({ pct, label = "Overall Project Progress" }: DonutChartProps) {
  const r = 72;
  const cx = 88;
  const cy = 88;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={176} height={176} viewBox="0 0 176 176" role="img" aria-label={`${label}: ${pct}%`} focusable="false">
      <title>{`${label}: ${pct}%`}</title>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5E2DA" strokeWidth={14} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#171717" strokeWidth={14} strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ * 0.25} strokeLinecap="round" />
      <text x={cx} y={cy - 8} textAnchor="middle" fontFamily="var(--font-instrument-sans),sans-serif" fontSize={26} fontWeight={400} fill="#171717" aria-hidden="true">
        {pct}%
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontFamily="var(--font-instrument-sans),sans-serif" fontSize={12} fill="#8A867C" aria-hidden="true">
        complete
      </text>
    </svg>
  );
}
