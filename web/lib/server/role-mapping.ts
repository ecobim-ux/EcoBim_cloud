/** iam.role.code (ADMIN/TEAM_LEAD/EMPLOYEE/CLIENT) -> portal role key.
    Pulled out of session.ts so this pure mapping can be unit tested without
    dragging in next/headers and the DB connection machinery the rest of
    that module needs. */
export function roleCodeToKey(code: string): string {
  switch (code) {
    case "ADMIN":
      return "admin";
    case "TEAM_LEAD":
      return "teamlead";
    case "EMPLOYEE":
      return "employee";
    case "CLIENT":
      return "client";
    default:
      return code.toLowerCase();
  }
}
