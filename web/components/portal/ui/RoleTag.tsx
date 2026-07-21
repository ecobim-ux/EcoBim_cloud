export const ROLE_CFG: Record<string, { l: string; bg: string }> = {
  admin: { l: "A", bg: "#171717" },
  teamlead: { l: "T", bg: "#3A6B47" },
  employee: { l: "E", bg: "#3B9EFF" },
  client: { l: "C", bg: "#B7770D" },
};

/** Small role indicator shown next to a person's name across the portal. */
export function RoleTag({ role }: { role?: string | null }) {
  if (!role) return null;
  const cfg = ROLE_CFG[role];
  if (!cfg) return null;
  return (
    <span
      title={role}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 15,
        height: 15,
        borderRadius: "50%",
        background: cfg.bg,
        color: "#fff",
        fontSize: 8.5,
        fontWeight: 700,
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {cfg.l}
    </span>
  );
}
