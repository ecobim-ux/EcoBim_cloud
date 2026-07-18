import { readClients, readPeople } from "./storage";

export interface Credential {
  id: string;
  pass: string;
  role: string;
  name: string;
  ini: string;
  display: string;
}

export const CREDENTIALS: Credential[] = [
  { id: "Client", pass: "Client@1", role: "client", name: "Dubai Marina Dev.", ini: "CL", display: "Client Portal" },
  { id: "led", pass: "led@1", role: "teamlead", name: "Pranav R.", ini: "PR", display: "Team Lead" },
  { id: "ABC", pass: "123", role: "employee", name: "Arjun Mehta", ini: "AM", display: "Employee" },
  { id: "Admin", pass: "Admin@1", role: "admin", name: "Admin User", ini: "AD", display: "Admin" },
];

/** Checks the static demo credentials, then the live (admin-editable) people
    directory, then admin-added client records — same precedence as the
    original portal.html. */
export function checkCredentials(id: string, pass: string): string | null {
  const match = CREDENTIALS.find((c) => c.id === id && c.pass === pass);
  if (match) return match.role;

  const p = readPeople().find((x) => x.loginId && x.loginId === id && x.pass === pass);
  if (p) return p.position;

  const c = readClients().find((x) => x.loginId === id && x.pass === pass);
  if (c) return "client";

  return null;
}
