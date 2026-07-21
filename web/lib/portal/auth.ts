export interface Credential {
  id: string;
  pass: string;
  role: string;
  name: string;
  ini: string;
  display: string;
}

/** Shown on the login screen as a quick-fill hint for the seeded demo
    accounts — actual authentication always goes through POST /api/auth/login
    against real bcrypt-hashed credentials in Postgres. */
export const CREDENTIALS: Credential[] = [
  { id: "Client", pass: "Client@1", role: "client", name: "Dubai Marina Dev.", ini: "CL", display: "Freelance Portal" },
  { id: "led", pass: "led@1", role: "teamlead", name: "Pranav R.", ini: "PR", display: "Team Lead" },
  { id: "ABC", pass: "123", role: "employee", name: "Arjun Mehta", ini: "AM", display: "Employee" },
  { id: "Admin", pass: "Admin@1", role: "admin", name: "Admin User", ini: "AD", display: "Admin" },
];
