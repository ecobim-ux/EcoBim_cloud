import { ROLE_CFG } from "./RoleTag";

interface AviProps {
  ini: string;
  size?: number;
  bg?: string;
  /** Shows the role letter as a badge on the avatar's corner instead of a
      separate tag after the name — there's no real profile photo, so the
      avatar circle is the natural place for it. */
  role?: string | null;
}

export function Avi({ ini, size = 32, bg = "#171717", role }: AviProps) {
  const cfg = role ? ROLE_CFG[role] : undefined;
  const badgeSize = Math.max(12, Math.round(size * 0.44));
  return (
    <div style={{ position: "relative", flexShrink: 0, width: size, height: size }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: bg,
          color: "#fff",
          fontSize: size * 0.37,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {ini}
      </div>
      {cfg && (
        <span
          title={role ?? undefined}
          style={{
            position: "absolute",
            bottom: -2,
            right: -2,
            width: badgeSize,
            height: badgeSize,
            borderRadius: "50%",
            background: cfg.bg,
            color: "#fff",
            fontSize: badgeSize * 0.56,
            fontWeight: 700,
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1.5px solid #fff",
          }}
        >
          {cfg.l}
        </span>
      )}
    </div>
  );
}
