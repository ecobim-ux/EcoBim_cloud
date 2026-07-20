/* ═══════════════════ DATA ═══════════════════
   Everything that had a real backend (projects, team, tasks, issues, RFIs)
   has moved to the real API layer — see lib/portal/{projects,team,tasks,
   issues,rfis}.ts. What remains here is either pure UI styling config
   (STATUS_DOT/BADGE_CFG) or domains not yet wired to a backend (MILESTONES'
   static label list still backs the milestone-linking picker in
   LeadTasksTab; DOCS is the Client Portal's Documents tab, which has no
   real document-storage backend yet). */

export interface Milestone {
  label: string;
  date: string;
  done: boolean;
  active?: boolean;
}

export const MILESTONES: Milestone[] = [
  { label: "Concept Model Submission", date: "Feb 2025", done: true },
  { label: "Schematic Design LOD 200", date: "Apr 2025", done: true },
  { label: "Design Development LOD 300", date: "Jun 2025", done: true },
  { label: "Construction Docs LOD 350", date: "Aug 2025", active: true, done: false },
  { label: "Tender Package Submission", date: "Oct 2025", done: false },
  { label: "LOD 400 Fabrication Models", date: "Dec 2025", done: false },
];

export interface Doc {
  name: string;
  type: string;
  icon: string;
  date: string;
}

export const DOCS: Doc[] = [
  { name: "Dubai Marina Tower — CD Set v4.2", type: "Drawings", icon: "▦", date: "10 Jul 2025" },
  { name: "Structural Coordination Model — Level 1–8", type: "Model", icon: "◈", date: "08 Jul 2025" },
  { name: "Clash Detection Report — Week 28", type: "Report", icon: "≡", date: "07 Jul 2025" },
  { name: "MEP Federated Model — Rev B", type: "Model", icon: "◈", date: "05 Jul 2025" },
  { name: "RFI Log — July 2025", type: "Report", icon: "≡", date: "01 Jul 2025" },
];

export const STATUS_DOT: Record<string, string> = {
  "In Progress": "#171717",
  Delayed: "#C0392B",
  Completed: "#1A7A4A",
  "Not Started": "#8A867C",
  Pending: "#B7770D",
};

/* ═══════════════════ ATOMS ═══════════════════ */
export const BADGE_CFG: Record<string, [string, string, string]> = {
  "In Progress": ["#F2F0EA", "#171717", "#3B9EFF"],
  Delayed: ["#FDECEA", "#C0392B", "#C0392B"],
  Completed: ["#EAFAF1", "#1A7A4A", "#1A7A4A"],
  "Not Started": ["#F5F5F5", "#7A7A7A", "#BDBDBD"],
  Pending: ["#FFF8E1", "#B7770D", "#B8860B"],
  Responded: ["#F2F0EA", "#171717", "#3B9EFF"],
  Closed: ["#EAFAF1", "#1A7A4A", "#1A7A4A"],
  Issue: ["#FDECEA", "#C0392B", "#C0392B"],
};
