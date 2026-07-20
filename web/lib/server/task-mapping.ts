import "server-only";

export const STATUS_CODE_TO_LABEL: Record<string, string> = {
  NOT_STARTED: "Not Started",
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  DELAYED: "Delayed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};
export const STATUS_LABEL_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(STATUS_CODE_TO_LABEL).map(([code, label]) => [label, code]),
);

export const PRIORITY_CODE_TO_LABEL: Record<string, string> = { HIGH: "High", MEDIUM: "Medium", LOW: "Low" };
export const PRIORITY_LABEL_TO_CODE: Record<string, string> = { High: "HIGH", Medium: "MEDIUM", Low: "LOW" };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2025-07-15" -> "15 Jul" (matches the short due-date format the UI already expects). */
export function formatShortDate(iso: string | Date | null): string | null {
  if (!iso) return null;
  const d = typeof iso === "string" ? new Date(iso + "T00:00:00Z") : iso;
  if (Number.isNaN(d.getTime())) return null;
  return String(d.getUTCDate()).padStart(2, "0") + " " + MONTHS[d.getUTCMonth()];
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
