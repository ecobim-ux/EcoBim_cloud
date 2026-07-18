export function SearchBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Search (⌘K)"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        height: 36,
        padding: "0 13px",
        background: "#fff",
        border: "1px solid #E5E2DA",
        borderRadius: 12,
        cursor: "pointer",
        fontSize: 12,
        color: "#8A867C",
        fontFamily: "var(--font-instrument-sans),sans-serif",
        transition: "background .15s,border-color .15s",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <span style={{ fontWeight: 500 }}>Search</span>
      <kbd style={{ fontSize: 10, background: "#F2F0EA", border: "1px solid #E5E2DA", borderRadius: 4, padding: "1px 5px", fontFamily: "inherit", marginLeft: 2, color: "#8A867C" }}>
        ⌘K
      </kbd>
    </button>
  );
}
