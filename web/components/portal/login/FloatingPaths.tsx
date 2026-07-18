export function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${152 - i * 5 * position} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${684 - i * 5 * position} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    opacity: 0.06 + i * 0.016,
    width: 0.4 + i * 0.035,
    dur: 18 + i * 0.9,
    delay: -(i * 1.4),
  }));
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 696 316" fill="none" aria-hidden="true">
      {paths.map((p) => (
        <path
          key={p.id}
          d={p.d}
          stroke="rgba(250,249,246,1)"
          strokeWidth={p.width}
          strokeOpacity={p.opacity}
          style={{
            strokeDasharray: 1500,
            strokeDashoffset: 1500,
            animation: `fp-draw ${p.dur}s ${p.delay}s linear infinite`,
          }}
        />
      ))}
    </svg>
  );
}
