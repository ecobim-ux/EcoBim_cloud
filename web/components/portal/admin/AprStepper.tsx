import { Fragment } from "react";

export const APR_FLOW = ["Lead Request", "Admin Review", "Client Sign-off", "Approved"];
export const aprActive = (stage: string) => (stage === "Approved" ? 3 : stage === "Sent to Client" ? 2 : 1);

export function AprStepper({ stage }: { stage: string }) {
  const active = aprActive(stage);
  const changes = stage === "Changes Requested";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap" }}>
      {APR_FLOW.map((s, i) => {
        const done = stage === "Approved" || i < active;
        const isAct = i === active && stage !== "Approved";
        const flag = isAct && changes;
        const col = done ? "#1A7A4A" : flag ? "#B7770D" : isAct ? "#171717" : "#C9C5BC";
        return (
          <Fragment key={s}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: done ? "#1A7A4A" : isAct ? (flag ? "#B7770D" : "#171717") : "#fff",
                  border: "1.5px solid " + col,
                  color: done || isAct ? "#fff" : "#C9C5BC",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {done ? "✓" : i + 1}
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: isAct || done ? "#171717" : "#8A867C", whiteSpace: "nowrap" }}>
                {flag && i === 1 ? "Changes requested" : s}
              </span>
            </div>
            {i < 3 && <div style={{ width: 24, height: 1.5, background: i < active ? "#1A7A4A" : "#E5E2DA", margin: "0 9px" }} />}
          </Fragment>
        );
      })}
    </div>
  );
}
