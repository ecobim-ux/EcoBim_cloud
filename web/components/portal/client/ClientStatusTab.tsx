import { Avi } from "../ui/Avi";
import { PBar } from "../ui/PBar";
import { ScheduleMeetingButton } from "../shared/ScheduleMeetingButton";
import { DonutChart } from "./DonutChart";

const PHASE_PROGRESS = [
  { n: "Concept", p: 100 },
  { n: "Schematic Design (SD)", p: 100 },
  { n: "Design Development (DD)", p: 100 },
  { n: "Construction Documents (CD)", p: 68 },
  { n: "Tender Package", p: 0 },
  { n: "Construction", p: 0 },
];

export function ClientStatusTab() {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 13, color: "#8A867C", fontWeight: 500, marginBottom: 8 }}>Overall Project Progress</div>
          <DonutChart pct={68} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
        <div style={{ background: "#EAFAF1", border: "1px solid #1A7A4A", borderRadius: 12, padding: "20px", textAlign: "center" }}>
          <div style={{ fontSize: 28 }}>✓</div>
          <div style={{ fontWeight: 600, marginTop: 8, color: "#1A7A4A" }}>On Track</div>
          <div style={{ fontSize: 13, color: "#5C594F", marginTop: 4 }}>3 of 4 phases on schedule</div>
        </div>
        <div style={{ background: "#FDECEA", border: "1px solid #C0392B", borderRadius: 12, padding: "20px", textAlign: "center" }}>
          <div style={{ fontSize: 28 }}>⚠</div>
          <div style={{ fontWeight: 600, marginTop: 8, color: "#C0392B" }}>Delayed Items</div>
          <div style={{ fontSize: 13, color: "#5C594F", marginTop: 4 }}>1 task pending consultant input</div>
        </div>
        <div style={{ background: "#F2F0EA", border: "1px solid #171717", borderRadius: 12, padding: "20px", textAlign: "center" }}>
          <div style={{ fontSize: 28 }}>🎯</div>
          <div style={{ fontWeight: 600, marginTop: 8, color: "#171717" }}>Upcoming</div>
          <div style={{ fontSize: 13, color: "#5C594F", marginTop: 4 }}>CD Submission — Aug 2025</div>
        </div>
      </div>
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E2DA", padding: "20px 24px", marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Phase Progress</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {PHASE_PROGRESS.map((ph) => (
            <div key={ph.n}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 13, color: ph.p === 100 ? "#1A7A4A" : ph.p > 0 ? "#171717" : "#8A867C" }}>{ph.n}</span>
                <span style={{ fontFamily: "var(--font-instrument-sans),sans-serif", fontSize: 12, color: ph.p === 100 ? "#1A7A4A" : ph.p > 0 ? "#171717" : "#8A867C", fontWeight: 600 }}>
                  {ph.p === 100 ? "Complete" : ph.p > 0 ? `${ph.p}%` : "Not started"}
                </span>
              </div>
              <PBar pct={ph.p} status={ph.p === 100 ? "Completed" : ph.p > 0 ? "In Progress" : "Not Started"} label={ph.n} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E2DA", padding: "20px 24px" }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Your Project Contact</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Avi ini="PR" size={48} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Pranav R.</div>
              <div style={{ fontSize: 13, color: "#8A867C" }}>Senior BIM Lead</div>
              <div style={{ fontSize: 13, color: "#171717", marginTop: 4 }}>pranav@ecobim.com</div>
            </div>
          </div>
          <ScheduleMeetingButton role="client" userName="Dubai Marina Developments" compact={true} />
        </div>
      </div>
    </div>
  );
}
