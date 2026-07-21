export function meetCode() {
  const s = "abcdefghijklmnopqrstuvwxyz";
  const p = (n: number) => Array.from({ length: n }, () => s[Math.floor(Math.random() * 26)]).join("");
  return p(3) + "-" + p(4) + "-" + p(3);
}

export function fmtMDate(iso: string) {
  try {
    const [y, m, d] = iso.split("-");
    const mo = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][+m - 1];
    return d + " " + mo + " " + y;
  } catch {
    return iso;
  }
}

export const todayISO = () => new Date().toISOString().slice(0, 10);

/** ISO date of the Monday of the current week. */
export function startOfWeekISO(): string {
  const d = new Date();
  const dayIdx = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - dayIdx);
  return d.toISOString().slice(0, 10);
}

export const _p2 = (n: number) => String(n).padStart(2, "0");

export function todayStr() {
  const d = new Date();
  return (
    String(d.getDate()).padStart(2, "0") +
    " " +
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()] +
    " " +
    d.getFullYear()
  );
}

/** Google Calendar "add event" template link. dateISO=YYYY-MM-DD; time optional HH:MM; durMin=length */
export function gcalLink(title: string, details: string, dateISO?: string, time?: string, durMin?: number) {
  try {
    if (!dateISO) dateISO = todayISO();
    const d = dateISO.replace(/-/g, "");
    if (!time) {
      const dt = new Date(dateISO + "T00:00:00");
      dt.setDate(dt.getDate() + 1);
      const end = dt.getFullYear() + _p2(dt.getMonth() + 1) + _p2(dt.getDate());
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(details || "")}&dates=${d}/${end}`;
    }
    const s = new Date(dateISO + "T" + time + ":00");
    const e = new Date(s.getTime() + (durMin || 60) * 60000);
    const f = (x: Date) => x.getFullYear() + _p2(x.getMonth() + 1) + _p2(x.getDate()) + "T" + _p2(x.getHours()) + _p2(x.getMinutes()) + "00";
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(details || "")}&dates=${f(s)}/${f(e)}`;
  } catch {
    return "";
  }
}

export const CLIENT_EMAILS: Record<string, string> = {
  "Dubai Marina Tower": "approvals@dubaimarina-dev.ae",
  "Downtown Mixed-Use Podium": "pmo@emaar.ae",
  "Jumeirah Villa Complex": "projects@alhabtoor.com",
};

/** "Sara Al Rashid" -> "SA" — first letter of the first and last name tokens. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const ROLE_LABEL_TO_KEY: Record<string, string> = {
  Admin: "admin",
  "Team Lead": "teamlead",
  Employee: "employee",
  Freelance: "client",
};
