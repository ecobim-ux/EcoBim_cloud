interface MobileTopBarProps {
  onMenuOpen: () => void;
  userName: string;
  role: string;
}

export function MobileTopBar({ onMenuOpen, role }: MobileTopBarProps) {
  return (
    <div className="mobile-topbar" aria-label="Mobile navigation bar" role="banner">
      <button className="mob-menu-btn" aria-label="Open navigation menu" aria-haspopup="true" onClick={onMenuOpen}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <span className="mobile-topbar-brand">
        <span style={{ color: "#3A6B47", fontStyle: "italic" }}>Eco</span>BIM
      </span>
      <span style={{ fontSize: 10.5, color: "#8A867C", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500 }}>
        {role}
      </span>
    </div>
  );
}
