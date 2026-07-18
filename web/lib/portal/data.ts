/* ═══════════════════ DATA ═══════════════════
   Ported verbatim from portal.html's mock dataset. This portal has no
   backend — all state is client-side mock data, matching the original. */

export interface Project {
  id: string;
  name: string;
  client: string;
  type: string;
  phase: string;
  lod: string;
  progress: number;
  teamSize: number;
  lead: string;
  issueCount: number;
  start: string;
  end: string;
  cpct: number;
}

export const PROJECTS: Project[] = [
  {
    id: "p1",
    name: "Dubai Marina Tower",
    client: "Dubai Marina Developments LLC",
    type: "Residential",
    phase: "CD",
    lod: "LOD 300–400",
    progress: 68,
    teamSize: 4,
    lead: "Pranav R.",
    issueCount: 3,
    start: "Jan 2025",
    end: "Dec 2025",
    cpct: 58,
  },
  {
    id: "p2",
    name: "Downtown Mixed-Use Podium",
    client: "Emaar Properties",
    type: "Commercial",
    phase: "DD",
    lod: "LOD 200–300",
    progress: 42,
    teamSize: 3,
    lead: "Pranav R.",
    issueCount: 1,
    start: "Mar 2025",
    end: "Feb 2026",
    cpct: 33,
  },
  {
    id: "p3",
    name: "Jumeirah Villa Complex",
    client: "Al Habtoor Group",
    type: "Private Residential",
    phase: "Concept",
    lod: "LOD 100–200",
    progress: 18,
    teamSize: 2,
    lead: "Pranav R.",
    issueCount: 0,
    start: "May 2025",
    end: "Apr 2026",
    cpct: 17,
  },
];

export interface TeamMember {
  id: string;
  name: string;
  ini: string;
  role: string;
  email: string;
  proj: string;
  task: string;
  lod: string;
  pct: number;
  status: string;
  hLog: number;
  hEst: number;
  last: string;
  hasDelay: boolean;
}

export const TEAM: TeamMember[] = [
  {
    id: "t1",
    name: "Arjun Mehta",
    ini: "AM",
    role: "BIM Coordinator",
    email: "arjun@ecobim.com",
    proj: "Dubai Marina Tower",
    task: "MEP Coordination — Level 5–8",
    lod: "LOD 350",
    pct: 72,
    status: "In Progress",
    hLog: 34,
    hEst: 40,
    last: "Today, 2:14 PM",
    hasDelay: false,
  },
  {
    id: "t2",
    name: "Sara Al Rashid",
    ini: "SA",
    role: "BIM Engineer",
    email: "sara@ecobim.com",
    proj: "Dubai Marina Tower",
    task: "Structural Model Update",
    lod: "LOD 300",
    pct: 45,
    status: "Delayed",
    hLog: 28,
    hEst: 36,
    last: "Today, 11:30 AM",
    hasDelay: true,
  },
  {
    id: "t3",
    name: "Vikram Nair",
    ini: "VN",
    role: "BIM Coordinator",
    email: "vikram@ecobim.com",
    proj: "Downtown Mixed-Use Podium",
    task: "Arch Model — Podium Level",
    lod: "LOD 250",
    pct: 61,
    status: "In Progress",
    hLog: 22,
    hEst: 30,
    last: "Yesterday, 4:45 PM",
    hasDelay: false,
  },
  {
    id: "t4",
    name: "Layla Hassan",
    ini: "LH",
    role: "Junior BIM Modeller",
    email: "layla@ecobim.com",
    proj: "Jumeirah Villa Complex",
    task: "Concept Massing Model",
    lod: "LOD 150",
    pct: 33,
    status: "In Progress",
    hLog: 16,
    hEst: 24,
    last: "Today, 9:00 AM",
    hasDelay: false,
  },
];

export interface MyTask {
  id: string;
  task: string;
  del: string;
  lod: string;
  phase: string;
  status: string;
  pct: number;
  due: string;
  delay: string | null;
  priority: string;
  est: number;
  by: string;
  assignedTo: string;
  today: boolean;
}

export const MY_TASKS: MyTask[] = [
  {
    id: "T01",
    task: "MEP Routing — Level 5",
    del: "Model",
    lod: "LOD 350",
    phase: "CD",
    status: "In Progress",
    pct: 72,
    due: "15 Jul",
    delay: null,
    priority: "High",
    est: 12,
    by: "Pranav R.",
    assignedTo: "Arjun Mehta",
    today: true,
  },
  {
    id: "T02",
    task: "Structural Clash Report",
    del: "Report",
    lod: "LOD 300",
    phase: "CD",
    status: "Delayed",
    pct: 45,
    due: "10 Jul",
    delay: "Pending structural drawings from consultant. Awaiting response by EOD.",
    priority: "High",
    est: 10,
    by: "Pranav R.",
    assignedTo: "Arjun Mehta",
    today: true,
  },
  {
    id: "T03",
    task: "Curtain Wall Drawings",
    del: "Drawings",
    lod: "LOD 400",
    phase: "CD",
    status: "Not Started",
    pct: 0,
    due: "22 Jul",
    delay: null,
    priority: "Medium",
    est: 16,
    by: "Admin",
    assignedTo: "Arjun Mehta",
    today: false,
  },
  {
    id: "T04",
    task: "RFI Response — Level 7",
    del: "RFI",
    lod: "LOD 300",
    phase: "CD",
    status: "Pending",
    pct: 20,
    due: "12 Jul",
    delay: null,
    priority: "Medium",
    est: 6,
    by: "Pranav R.",
    assignedTo: "Arjun Mehta",
    today: true,
  },
  {
    id: "T05",
    task: "Arch Model Update — L1–4",
    del: "Model",
    lod: "LOD 300",
    phase: "CD",
    status: "Completed",
    pct: 100,
    due: "05 Jul",
    delay: null,
    priority: "Low",
    est: 14,
    by: "Pranav R.",
    assignedTo: "Arjun Mehta",
    today: false,
  },
];

export interface TimeLog {
  date: string;
  task: string;
  hours: number;
  type: string;
}

export const TIME_LOGS: TimeLog[] = [
  { date: "Mon, 7 Jul", task: "MEP Routing — Level 5", hours: 6.5, type: "Modeling" },
  { date: "Mon, 7 Jul", task: "RFI Response — Level 7", hours: 1.0, type: "RFI" },
  { date: "Tue, 8 Jul", task: "Structural Clash Report", hours: 4.0, type: "Coordination" },
  { date: "Wed, 9 Jul", task: "MEP Routing — Level 5", hours: 7.0, type: "Modeling" },
  { date: "Thu, 10 Jul", task: "Curtain Wall Drawings", hours: 3.5, type: "Documentation" },
  { date: "Thu, 10 Jul", task: "Structural Clash Report", hours: 2.5, type: "Coordination" },
];

export interface Rfi {
  id: string;
  title: string;
  status: string;
  raised: string;
  priority: string;
}

export const RFIS: Rfi[] = [
  { id: "RFI-014", title: "MEP Routing Conflict — Level 5", status: "Pending", raised: "08 Jul 2025", priority: "High" },
  { id: "RFI-011", title: "Curtain Wall Spec Clarification", status: "Responded", raised: "02 Jul 2025", priority: "Medium" },
  { id: "RFI-009", title: "Slab Thickness — Podium", status: "Closed", raised: "24 Jun 2025", priority: "Low" },
  { id: "RFI-007", title: "Structural Column Grid Revision", status: "Responded", raised: "18 Jun 2025", priority: "High" },
];

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

export interface Issue {
  id: string;
  title: string;
  by: string;
  date: string;
  desc: string;
  sev: string;
  status: string;
}

export const ISSUES: Issue[] = [
  {
    id: "ISS-008",
    title: "MEP–Structural Clash — Level 5–8",
    by: "Arjun Mehta",
    date: "09 Jul 2025",
    desc: "HVAC ducts intersecting with primary steel beams across levels 5–8. Requires structural revision or MEP rerouting.",
    sev: "High",
    status: "In Progress",
  },
  {
    id: "ISS-007",
    title: "Delayed Structural Drawings",
    by: "Sara Al Rashid",
    date: "08 Jul 2025",
    desc: "Structural consultant drawings for podium levels 1–3 not received. Blocking model update and coordination milestone.",
    sev: "High",
    status: "Pending",
  },
  {
    id: "ISS-005",
    title: "LOD Mismatch — Curtain Wall",
    by: "Pranav R.",
    date: "03 Jul 2025",
    desc: "Curtain wall modeled at LOD 300 but project BEP requires LOD 400 for CD phase.",
    sev: "Medium",
    status: "In Progress",
  },
  {
    id: "ISS-003",
    title: "RFI Response Overdue — Client",
    by: "Pranav R.",
    date: "28 Jun 2025",
    desc: "Client approval for RFI-011 is overdue by 5 business days. Impacting curtain wall drawing schedule.",
    sev: "Medium",
    status: "Pending",
  },
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

export interface Phase {
  name: string;
  w: number;
  done?: boolean;
  active?: boolean;
}

export const PHASES: Phase[] = [
  { name: "Concept", w: 12, done: true },
  { name: "SD", w: 13, done: true },
  { name: "DD", w: 15, done: true },
  { name: "CD", w: 25, active: true },
  { name: "Tender", w: 17 },
  { name: "Const.", w: 18 },
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
