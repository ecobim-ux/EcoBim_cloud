interface NotifBellProps {
  count?: number;
  onClick: () => void;
}

export function NotifBell({ count = 0, onClick }: NotifBellProps) {
  return (
    <button
      onClick={onClick}
      className="btn-bell"
      title="Notifications"
      style={{
        position: "relative",
        background: "#fff",
        border: "1px solid #E5E2DA",
        borderRadius: 12,
        padding: "8px 11px",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: 36,
        transition: "background .15s",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#171717" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {count > 0 && (
        <span style={{ position: "absolute", top: -5, right: -5, background: "#C0392B", color: "#fff", borderRadius: 12, fontSize: 9, fontWeight: 700, padding: "1px 5px", minWidth: 16, textAlign: "center", lineHeight: "1.5" }}>
          {count}
        </span>
      )}
    </button>
  );
}
