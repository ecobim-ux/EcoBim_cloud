import { MY_TASKS, type TeamMember, TIME_LOGS } from "./data";
import { readAssignedTasks, readETask } from "./storage";

export interface ProductivityData {
  weekly: number;
  target: number;
  productivity: number;
  remainingToday: number;
  delayed: number;
  completed: number;
  days: [string, number][];
}

/** Arjun Mehta is the only employee with a live task/hour-logging trail (the
    demo user for MyTasksTab / TimeLogTab). Everyone else's productivity is
    derived from their static TEAM record instead. */
function computeArjunProductivity(): ProductivityData {
  const state = readETask();
  const assigned = readAssignedTasks().filter((t) => t.assignedTo === "Arjun Mehta");
  const all = [...MY_TASKS, ...assigned].map((t) => {
    const s = state[t.id as string] || {};
    const logged = (s.records || []).reduce((a, r) => a + (+r.hours || 0), 0);
    return {
      ...t,
      logged,
      status: s.status || (t as { status?: string }).status,
      today: (t as { today?: boolean }).today !== undefined ? (t as { today?: boolean }).today : true,
    };
  });
  const seedHours = TIME_LOGS.reduce((a, l) => a + l.hours, 0);
  const loggedExtra = all.reduce((a, t) => a + t.logged, 0);
  const weekly = +(seedHours + loggedExtra).toFixed(1);
  const remainingToday = all.filter((t) => t.status !== "Completed" && t.today).length;
  const delayed = all.filter((t) => t.status === "Delayed").length;
  const completed = all.filter((t) => t.status === "Completed").length;
  const target = 40;
  const productivity = Math.min(100, Math.round((weekly / target) * 100));
  const days: [string, number][] = [
    ["Mon", 6.5],
    ["Tue", 4.0],
    ["Wed", 7.0],
    ["Thu", 6.0],
    ["Fri", weekly > 23.5 ? +(weekly - 23.5).toFixed(1) : 0],
  ];
  return { weekly, target, productivity, remainingToday, delayed, completed, days };
}

/** Approximates a weekly breakdown from a team member's static hLog/hEst
    record — used for members that don't have per-task logging data. */
function computeGenericProductivity(m: TeamMember): ProductivityData {
  const weekly = m.hLog;
  const target = m.hEst;
  const productivity = target > 0 ? Math.min(100, Math.round((weekly / target) * 100)) : 0;
  const delayed = m.status === "Delayed" ? 1 : 0;
  const completed = m.status === "Completed" ? 1 : 0;
  const remainingToday = m.status === "Completed" ? 0 : 1;
  const perDay = +(weekly / 5).toFixed(1);
  const days: [string, number][] = [
    ["Mon", perDay],
    ["Tue", perDay],
    ["Wed", perDay],
    ["Thu", perDay],
    ["Fri", +(weekly - perDay * 4).toFixed(1)],
  ];
  return { weekly, target, productivity, remainingToday, delayed, completed, days };
}

export function computeProductivity(m: TeamMember): ProductivityData {
  return m.name === "Arjun Mehta" ? computeArjunProductivity() : computeGenericProductivity(m);
}
