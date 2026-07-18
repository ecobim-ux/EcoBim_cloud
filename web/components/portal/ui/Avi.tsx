interface AviProps {
  ini: string;
  size?: number;
  bg?: string;
}

export function Avi({ ini, size = 32, bg = "#171717" }: AviProps) {
  return (
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
        flexShrink: 0,
      }}
    >
      {ini}
    </div>
  );
}
