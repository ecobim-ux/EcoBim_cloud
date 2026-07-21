interface NavIconProps {
  name: string;
  size?: number;
  color?: string;
}

export function NavIcon({ name, size = 16, color = "currentColor" }: NavIconProps) {
  const s = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const icons: Record<string, React.ReactNode> = {
    "My Tasks": (
      <svg {...s}>
        <rect x="3" y="5" width="6" height="6" rx="1" />
        <rect x="3" y="13" width="6" height="6" rx="1" />
        <line x1="13" y1="7" x2="21" y2="7" />
        <line x1="13" y1="17" x2="21" y2="17" />
      </svg>
    ),
    Productivity: (
      <svg {...s}>
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15.5 12" />
      </svg>
    ),
    RFIs: (
      <svg {...s}>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    RFI: (
      <svg {...s}>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    Milestones: (
      <svg {...s}>
        <polyline points="22 7 13 7 13 3 11 3 11 7 2 7" />
        <polyline points="22 17 13 17 13 21 11 21 11 17 2 17" />
        <line x1="2" y1="12" x2="22" y2="12" />
      </svg>
    ),
    "Milestones & Approvals": (
      <svg {...s}>
        <polyline points="22 7 13 7 13 3 11 3 11 7 2 7" />
        <polyline points="22 17 13 17 13 21 11 21 11 17 2 17" />
        <line x1="2" y1="12" x2="22" y2="12" />
      </svg>
    ),
    Overview: (
      <svg {...s}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    "My Team": (
      <svg {...s}>
        <circle cx="9" cy="7" r="3" />
        <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
        <circle cx="18" cy="7" r="2" />
        <path d="M22 21v-1.5a3 3 0 00-3-3h-1" />
      </svg>
    ),
    Issues: (
      <svg {...s}>
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    "Issues & RFIs": (
      <svg {...s}>
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    "All Projects": (
      <svg {...s}>
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    "Team Management": (
      <svg {...s}>
        <circle cx="9" cy="7" r="3" />
        <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
        <circle cx="18" cy="7" r="2" />
        <path d="M22 21v-1.5a3 3 0 00-3-3h-1" />
      </svg>
    ),
    "Freelance Management": (
      <svg {...s}>
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    Management: (
      <svg {...s}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
    Reports: (
      <svg {...s}>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    Requests: (
      <svg {...s}>
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    Tasks: (
      <svg {...s}>
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
    "Work Items": (
      <svg {...s}>
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
    "Project Status": (
      <svg {...s}>
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    Documents: (
      <svg {...s}>
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  };
  return (
    icons[name] || (
      <svg {...s}>
        <circle cx="12" cy="12" r="2" />
      </svg>
    )
  );
}
