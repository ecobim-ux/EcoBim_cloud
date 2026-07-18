/* ═══════════════════ MOCK PERSISTENCE LAYER ═══════════════════
   The portal has no real backend — every "save" is a localStorage read/write,
   exactly as in the original portal.html. Ported verbatim, including the
   defensive try/catch around every localStorage call (which — conveniently —
   also makes these safe to call during server-side rendering, since
   `localStorage` throwing a ReferenceError on the server is simply caught,
   same as a private-browsing exception would be in the browser). */

/* ═══ ESTIMATE REQUESTS ═══ */
export interface EstimateRequest {
  id: string;
  name: string;
  company: string;
  role: string;
  scale: string;
  services: string[];
  details: string;
  date: string;
  status: string;
  assignedTo: string | null;
  assignedEmployee: string | null;
  email: string;
  phone: string;
}

export const DEMO_REQUESTS: EstimateRequest[] = [
  {
    id: "REQ-09821",
    name: "Khalid Al Mansoori",
    company: "Al Mansoori Real Estate",
    role: "Developer / Owner",
    scale: "520k sq ft",
    services: ["3D Modeling", "Clash Coordination", "4D / 5D"],
    details: "Mixed-use tower in Business Bay. Currently at concept stage, need LOD 300 models ready for DD by Q3 2026.",
    date: "07 Jun 2026",
    status: "New",
    assignedTo: null,
    assignedEmployee: null,
    email: "k.mansoori@alm-re.ae",
    phone: "+971 50 234 5678",
  },
  {
    id: "REQ-08134",
    name: "Sarah Mitchell",
    company: "Construct Gulf LLC",
    role: "General Contractor",
    scale: "280k sq ft",
    services: ["Clash Coordination", "Shop Drawings"],
    details: "Residential complex in JVC. Structural and MEP coordination needed. Tender in 6 weeks — timeline is very tight.",
    date: "08 Jun 2026",
    status: "Contacted",
    assignedTo: null,
    assignedEmployee: null,
    email: "s.mitchell@constructgulf.com",
    phone: "+971 55 876 4321",
  },
  {
    id: "REQ-07452",
    name: "Omar Farouq",
    company: "Emarat Developments",
    role: "Architect",
    scale: "180k sq ft",
    services: ["3D Modeling", "Quantity Takeoff"],
    details: "Villa cluster in Dubai Hills. Need Arch model at LOD 300 and QTO for cost plan submission.",
    date: "05 Jun 2026",
    status: "Assigned",
    assignedTo: "Pranav R.",
    assignedEmployee: "Arjun Mehta",
    email: "o.farouq@emarat-dev.com",
    phone: "+971 52 109 8765",
  },
];

export function seedRequests() {
  try {
    const ex = localStorage.getItem("bimco_requests");
    if (!ex || JSON.parse(ex).length === 0) localStorage.setItem("bimco_requests", JSON.stringify(DEMO_REQUESTS));
  } catch {
    /* noop */
  }
}

export function readRequests(): EstimateRequest[] {
  try {
    return JSON.parse(localStorage.getItem("bimco_requests") || "[]");
  } catch {
    return DEMO_REQUESTS;
  }
}

export function writeRequests(arr: EstimateRequest[]) {
  try {
    localStorage.setItem("bimco_requests", JSON.stringify(arr));
  } catch {
    /* noop */
  }
}

/* ═══ NOTIFICATION + ASSIGNED TASK SYSTEM ═══ */
export const NOTIF_KEY = "bimco_notifications";
export const TASKS_KEY = "bimco_assigned_tasks";

export interface NotifItem {
  id: string;
  role: string;
  title: string;
  body: string;
  tab?: string;
  read: boolean;
  ts: number;
}

export function readNotifs(role?: string): NotifItem[] {
  try {
    const a: NotifItem[] = JSON.parse(localStorage.getItem(NOTIF_KEY) || "[]");
    return role ? a.filter((n) => n.role === role) : a;
  } catch {
    return [];
  }
}

export function addNotif(n: Omit<NotifItem, "id" | "read" | "ts">) {
  try {
    const a: NotifItem[] = JSON.parse(localStorage.getItem(NOTIF_KEY) || "[]");
    a.unshift({ ...n, id: "N" + Date.now(), read: false, ts: Date.now() });
    localStorage.setItem(NOTIF_KEY, JSON.stringify(a));
  } catch {
    /* noop */
  }
}

export function markRoleNotifsRead(role: string) {
  try {
    const a: NotifItem[] = JSON.parse(localStorage.getItem(NOTIF_KEY) || "[]");
    localStorage.setItem(NOTIF_KEY, JSON.stringify(a.map((n) => (n.role === role ? { ...n, read: true } : n))));
  } catch {
    /* noop */
  }
}

export function getUnreadCounts(role: string): Record<string, number> {
  const c: Record<string, number> = {};
  readNotifs(role)
    .filter((n) => !n.read)
    .forEach((n) => {
      if (n.tab) c[n.tab] = (c[n.tab] || 0) + 1;
    });
  return c;
}

export const getUnreadTotal = (role: string) => readNotifs(role).filter((n) => !n.read).length;

export interface AssignedTask {
  id: string;
  [key: string]: unknown;
}

export function readAssignedTasks(): AssignedTask[] {
  try {
    return JSON.parse(localStorage.getItem(TASKS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function writeAssignedTasks(a: AssignedTask[]) {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(a));
  } catch {
    /* noop */
  }
}

export function addAssignedTask(t: AssignedTask) {
  try {
    const a = JSON.parse(localStorage.getItem(TASKS_KEY) || "[]");
    a.unshift(t);
    localStorage.setItem(TASKS_KEY, JSON.stringify(a));
  } catch {
    /* noop */
  }
}

export function updateAssignedTask(id: string, patch: Partial<AssignedTask>) {
  const a = readAssignedTasks().map((t) => (t.id === id ? { ...t, ...patch } : t));
  writeAssignedTasks(a);
  return a;
}

/** Seeds a starter set of unread notifications the first time the app runs in a browser. */
export function seedNotifications() {
  try {
    if (!localStorage.getItem(NOTIF_KEY))
      localStorage.setItem(
        NOTIF_KEY,
        JSON.stringify([
          { id: "SN1", role: "admin", title: "New estimate request", body: "Khalid Al Mansoori from Al Mansoori Real Estate submitted a request.", tab: "Team Management", read: false, ts: Date.now() - 3600000 },
          { id: "SN2", role: "admin", title: "New estimate request", body: "Sarah Mitchell from Construct Gulf LLC submitted a request.", tab: "Team Management", read: false, ts: Date.now() - 7200000 },
          { id: "SN3", role: "teamlead", title: "Request assigned to you", body: "Admin assigned: Omar Farouq / Emarat Developments — LOD 300 Villa Cluster.", tab: "Requests", read: false, ts: Date.now() - 1800000 },
          { id: "SN4", role: "teamlead", title: "Issue raised on your project", body: "MEP–Structural Clash Level 5–8 reported by Arjun Mehta.", tab: "Issues", read: false, ts: Date.now() - 900000 },
          { id: "SN5", role: "employee", title: "New task assigned", body: "Pranav R. assigned: MEP Routing — Level 5 (LOD 350). Due 15 Jul.", tab: "My Tasks", read: false, ts: Date.now() - 5400000 },
          { id: "SN6", role: "employee", title: "RFI requires your response", body: "RFI-014: MEP Routing Conflict — Level 5 is pending your input.", tab: "RFIs", read: false, ts: Date.now() - 10800000 },
          { id: "SN7", role: "client", title: "Milestone ready for approval", body: "Construction Docs LOD 350 has been submitted and requires your approval.", tab: "Milestones & Approvals", read: false, ts: Date.now() - 3600000 },
          { id: "SN8", role: "client", title: "RFI-011 has been responded to", body: "Your curtain wall spec clarification has been answered by the BIM team.", tab: "RFIs", read: false, ts: Date.now() - 86400000 },
        ]),
      );
  } catch {
    /* noop */
  }
}

/* ═══════════════════ PEOPLE DIRECTORY · REACH RULES · MEETINGS ═══════════════════ */
export const PEOPLE_KEY = "bimco_people";
export const REACH_KEY = "bimco_reach";
export const MEET_KEY = "bimco_meetings";

export const POS_LABEL: Record<string, string> = {
  admin: "Admin",
  teamlead: "Team Lead",
  employee: "Employee",
  client: "Client",
};
export const POS_ORDER = ["admin", "teamlead", "employee", "client"];

export interface Person {
  id: string;
  name: string;
  ini: string;
  email: string;
  position: string;
  loginId: string;
  pass: string;
}

export const SEED_PEOPLE: Person[] = [
  { id: "u-admin", name: "Admin User", ini: "AD", email: "info@ecobim.co", position: "admin", loginId: "Admin", pass: "Admin@1" },
  { id: "u-lead", name: "Pranav R.", ini: "PR", email: "pranav@ecobim.com", position: "teamlead", loginId: "led", pass: "led@1" },
  { id: "u-arjun", name: "Arjun Mehta", ini: "AM", email: "arjun@ecobim.com", position: "employee", loginId: "ABC", pass: "123" },
  { id: "u-sara", name: "Sara Al Rashid", ini: "SA", email: "sara@ecobim.com", position: "employee", loginId: "sara", pass: "ecobim@1" },
  { id: "u-vikram", name: "Vikram Nair", ini: "VN", email: "vikram@ecobim.com", position: "employee", loginId: "vikram", pass: "ecobim@1" },
  { id: "u-layla", name: "Layla Hassan", ini: "LH", email: "layla@ecobim.com", position: "employee", loginId: "layla", pass: "ecobim@1" },
  { id: "u-client", name: "Dubai Marina Developments", ini: "CL", email: "projects@dubaimarina.ae", position: "client", loginId: "Client", pass: "Client@1" },
];

export const SEED_REACH: Record<string, string[]> = {
  client: ["admin"],
  admin: ["admin", "teamlead", "employee", "client"],
  teamlead: ["employee", "admin"],
  employee: ["teamlead"],
};

export function readPeople(): Person[] {
  try {
    const raw = localStorage.getItem(PEOPLE_KEY);
    if (!raw) {
      localStorage.setItem(PEOPLE_KEY, JSON.stringify(SEED_PEOPLE));
      return SEED_PEOPLE;
    }
    const stored: Person[] = JSON.parse(raw);
    /* back-fill loginId / pass from SEED_PEOPLE for existing records that predate this field */
    const patched = stored.map((p) => {
      if (p.loginId && p.pass) return p;
      const seed = SEED_PEOPLE.find((s) => s.id === p.id);
      return seed ? { ...seed, ...p, loginId: p.loginId || seed.loginId, pass: p.pass || seed.pass } : p;
    });
    const changed = patched.some((p, i) => p.loginId !== stored[i].loginId || p.pass !== stored[i].pass);
    if (changed) localStorage.setItem(PEOPLE_KEY, JSON.stringify(patched));
    return patched;
  } catch {
    return SEED_PEOPLE;
  }
}

export function writePeople(a: Person[]) {
  try {
    localStorage.setItem(PEOPLE_KEY, JSON.stringify(a));
  } catch {
    /* noop */
  }
}

export function readReach(): Record<string, string[]> {
  try {
    const r = localStorage.getItem(REACH_KEY);
    if (!r) {
      localStorage.setItem(REACH_KEY, JSON.stringify(SEED_REACH));
      return SEED_REACH;
    }
    return { ...SEED_REACH, ...JSON.parse(r) };
  } catch {
    return SEED_REACH;
  }
}

export function writeReach(o: Record<string, string[]>) {
  try {
    localStorage.setItem(REACH_KEY, JSON.stringify(o));
  } catch {
    /* noop */
  }
}

export interface Meeting {
  code: string;
  [key: string]: unknown;
}

export function readMeetings(): Meeting[] {
  try {
    return JSON.parse(localStorage.getItem(MEET_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addMeeting(m: Meeting) {
  try {
    const a = readMeetings();
    a.unshift(m);
    localStorage.setItem(MEET_KEY, JSON.stringify(a));
  } catch {
    /* noop */
  }
}

/* ═══════════════════ RAISED ISSUES ═══════════════════ */
export const RAISED_ISSUES_KEY = "bimco_raised_issues";

export interface RaisedIssue {
  id: string;
  title: string;
  by: string;
  to?: string;
  toRole?: string;
  date: string;
  desc: string;
  sev: string;
  status: string;
}

export function readRaisedIssues(): RaisedIssue[] {
  try {
    return JSON.parse(localStorage.getItem(RAISED_ISSUES_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addRaisedIssue(i: RaisedIssue) {
  try {
    const a = readRaisedIssues();
    a.unshift(i);
    localStorage.setItem(RAISED_ISSUES_KEY, JSON.stringify(a));
  } catch {
    /* noop */
  }
}

/* ═══════════════════ CLIENTS · APPROVALS ═══════════════════ */
export const CLIENTS_KEY = "bimco_clients";
export const APPROVALS_KEY = "bimco_approvals_v2";

export interface ApprovalHistoryEntry {
  label: string;
  date: string;
}

export interface Approval {
  id: string;
  proj: string;
  milestone: string;
  submitted: string;
  client: string;
  clientEmail: string;
  by: string;
  stage: string;
  leadNote: string;
  adminNote: string;
  lastReminder: string | null;
  history: ApprovalHistoryEntry[];
}

export const SEED_APPROVALS: Approval[] = [
  {
    id: "a1",
    proj: "Dubai Marina Tower",
    milestone: "CD Model Submission",
    submitted: "08 Jul 2025",
    client: "Dubai Marina Dev.",
    clientEmail: "approvals@dubaimarina-dev.ae",
    by: "Pranav R.",
    stage: "Lead Requested",
    leadNote: "CD set is ready — please review before it goes to the client.",
    adminNote: "",
    lastReminder: null,
    history: [{ label: "Team lead requested admin review", date: "08 Jul 2025" }],
  },
  {
    id: "a2",
    proj: "Downtown Mixed-Use Podium",
    milestone: "DD Coordination Model",
    submitted: "05 Jul 2025",
    client: "Emaar Properties",
    clientEmail: "pmo@emaar.ae",
    by: "Pranav R.",
    stage: "Sent to Client",
    leadNote: "DD federated model ready for client sign-off.",
    adminNote: "Reviewed internally — looks good, forwarded to client.",
    lastReminder: null,
    history: [
      { label: "Team lead requested admin review", date: "02 Jul 2025" },
      { label: "Admin reviewed & sent to client", date: "05 Jul 2025" },
    ],
  },
  {
    id: "a3",
    proj: "Jumeirah Villa Complex",
    milestone: "Concept Massing Sign-off",
    submitted: "03 Jul 2025",
    client: "Al Habtoor Group",
    clientEmail: "projects@alhabtoor.com",
    by: "Pranav R.",
    stage: "Changes Requested",
    leadNote: "Concept massing for client sign-off.",
    adminNote: "Add a shadow study and update the plot ratio before we send this to the client.",
    lastReminder: null,
    history: [
      { label: "Team lead requested admin review", date: "01 Jul 2025" },
      { label: "Admin requested updates", date: "03 Jul 2025" },
    ],
  },
];

export interface ClientRecord {
  loginId?: string;
  pass?: string;
  [key: string]: unknown;
}

export function readClients(): ClientRecord[] {
  try {
    return JSON.parse(localStorage.getItem(CLIENTS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addClientRec(c: ClientRecord) {
  try {
    const a = readClients();
    a.unshift(c);
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(a));
  } catch {
    /* noop */
  }
}

export function readApprovals(): Approval[] {
  try {
    const a = localStorage.getItem(APPROVALS_KEY);
    if (!a) {
      localStorage.setItem(APPROVALS_KEY, JSON.stringify(SEED_APPROVALS));
      return SEED_APPROVALS;
    }
    return JSON.parse(a);
  } catch {
    return SEED_APPROVALS;
  }
}

export function writeApprovals(a: Approval[]) {
  try {
    localStorage.setItem(APPROVALS_KEY, JSON.stringify(a));
  } catch {
    /* noop */
  }
}

/* ═══════════════════ WORK ITEMS (admin/lead task breakdown) ═══════════════════ */
export const WORK_KEY = "bimco_workitems";

export interface WorkSubtask {
  id: string;
  title: string;
  assignedTo: string;
  due: string;
  status: string;
  issueNote: string;
}

export interface WorkItem {
  id: string;
  title: string;
  desc: string;
  project: string;
  due: string;
  assignedLead: string;
  createdBy: string;
  created: string;
  subtasks: WorkSubtask[];
}

export const SEED_WORK: WorkItem[] = [
  {
    id: "WI-1001",
    title: "CD Package — Tower Levels 9–16",
    desc: "Produce coordinated CD set for levels 9–16 including MEP coordination and clash resolution.",
    project: "Dubai Marina Tower",
    due: "30 Jul 2026",
    assignedLead: "Pranav R.",
    createdBy: "Admin",
    created: "05 Jun 2026",
    subtasks: [
      { id: "ST-1", title: "MEP model update — L9–12", assignedTo: "Arjun Mehta", due: "15 Jul", status: "Completed", issueNote: "" },
      { id: "ST-2", title: "Clash run & BCF log — L9–16", assignedTo: "Arjun Mehta", due: "18 Jul", status: "Pending", issueNote: "" },
      { id: "ST-3", title: "Structural model — L13–16", assignedTo: "Sara Al Rashid", due: "20 Jul", status: "Issue", issueNote: "Awaiting consultant drawings for L14 transfer slab." },
    ],
  },
];

export function readWork(): WorkItem[] {
  try {
    const w = localStorage.getItem(WORK_KEY);
    if (!w) {
      localStorage.setItem(WORK_KEY, JSON.stringify(SEED_WORK));
      return SEED_WORK;
    }
    return JSON.parse(w);
  } catch {
    return SEED_WORK;
  }
}

export function writeWork(arr: WorkItem[]) {
  try {
    localStorage.setItem(WORK_KEY, JSON.stringify(arr));
  } catch {
    /* noop */
  }
}

export const wiStatus = (wi: WorkItem) => {
  if (!wi.subtasks || !wi.subtasks.length) return "Pending";
  if (wi.subtasks.every((s) => s.status === "Completed")) return "Completed";
  return "In Progress";
};

export const wiHasIssue = (wi: WorkItem) => (wi.subtasks || []).some((s) => s.status === "Issue");

export const wiPct = (wi: WorkItem) => {
  const st = wi.subtasks || [];
  if (!st.length) return 0;
  return Math.round((st.filter((s) => s.status === "Completed").length / st.length) * 100);
};

/* ═══════════════════ EMPLOYEE TASK STATE (hours logged, completion) ═══════════════════ */
export const ETASK_KEY = "bimco_emp_task_state";

export interface TaskRecord {
  hours: number;
  date: string;
}

export interface ETaskState {
  records?: TaskRecord[];
  status?: string;
  completedOn?: string;
}

export function readETask(): Record<string, ETaskState> {
  try {
    return JSON.parse(localStorage.getItem(ETASK_KEY) || "{}");
  } catch {
    return {};
  }
}

export function writeETask(o: Record<string, ETaskState>) {
  try {
    localStorage.setItem(ETASK_KEY, JSON.stringify(o));
  } catch {
    /* noop */
  }
}

/* ═══════════════════ ISSUE FLAGS (resolved / escalation / response) ═══════════════════ */
export const ISSUE_FLAGS_KEY = "bimco_issue_flags";

export interface IssueFlags {
  resolved?: boolean;
  raisedToAdmin?: boolean;
  response?: string;
  respondedBy?: string;
  respondedDate?: string;
}

export function readIssueFlags(): Record<string, IssueFlags> {
  try {
    return JSON.parse(localStorage.getItem(ISSUE_FLAGS_KEY) || "{}");
  } catch {
    return {};
  }
}

export function patchIssueFlags(id: string, patch: IssueFlags): Record<string, IssueFlags> {
  const all = readIssueFlags();
  const next = { ...all, [id]: { ...all[id], ...patch } };
  try {
    localStorage.setItem(ISSUE_FLAGS_KEY, JSON.stringify(next));
  } catch {
    /* noop */
  }
  return next;
}

/* Run once, at module load — matches the original inline script, which seeded
   this data at script-parse time, before any component had a chance to read
   an empty localStorage key on its first render. */
if (typeof window !== "undefined") {
  seedRequests();
  seedNotifications();
}
