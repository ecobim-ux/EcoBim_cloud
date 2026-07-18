const REQ_STATUS_CFG: Record<string, [string, string, string]> = {
  New: ["#F2F0EA", "#171717", "#3B9EFF"],
  Contacted: ["#FFF8E1", "#B7770D", "#B8860B"],
  Assigned: ["#EAFAF1", "#1A7A4A", "#1A7A4A"],
};

export function ReqBadge({ s }: { s: string }) {
  const c = REQ_STATUS_CFG[s] || REQ_STATUS_CFG["New"];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: c[0],
        color: c[1],
        padding: "3px 10px",
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c[2], flexShrink: 0 }} />
      {s}
    </span>
  );
}
