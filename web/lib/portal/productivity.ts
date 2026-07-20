import type { ApiTask } from "@/app/api/tasks/route";
import { startOfWeekISO } from "./helpers";

export interface ProductivityData {
  weekly: number;
  target: number;
  productivity: number;
  remainingToday: number;
  delayed: number;
  completed: number;
  days: [string, number][];
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri"];

/** Computes productivity from a person's real, backend-fetched tasks —
    weekly hours and the daily breakdown are both derived from their real
    logged time-entry records for the current week, not a fabricated split. */
export function computeProductivityFromTasks(tasks: ApiTask[]): ProductivityData {
  const weekStartISO = startOfWeekISO();
  const weekStart = new Date(weekStartISO + "T00:00:00Z");
  const thisWeekRecords = tasks.flatMap((t) => t.records).filter((r) => r.date >= weekStartISO);
  const weekly = +thisWeekRecords.reduce((a, r) => a + (r.hours || 0), 0).toFixed(1);
  const remainingToday = tasks.filter((t) => t.status !== "Completed" && t.today).length;
  const delayed = tasks.filter((t) => t.status === "Delayed").length;
  const completed = tasks.filter((t) => t.status === "Completed").length;
  const target = 40;
  const productivity = Math.min(100, Math.round((weekly / target) * 100));
  const days: [string, number][] = DAY_NAMES.map((name, i) => {
    const d = new Date(weekStart);
    d.setUTCDate(d.getUTCDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const hours = thisWeekRecords.filter((r) => r.date === iso).reduce((a, r) => a + (r.hours || 0), 0);
    return [name, +hours.toFixed(1)];
  });
  return { weekly, target, productivity, remainingToday, delayed, completed, days };
}

