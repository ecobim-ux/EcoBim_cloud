import { site } from "@/lib/site-content";
import SectionHeader from "./SectionHeader";

export default function ProcessSection() {
  const { steps, total } = site.process;

  return (
    <section style={{ padding: "5rem var(--margin)" }} id="process" aria-labelledby="process-title">
      <div style={{ paddingBottom: "3rem" }}>
        <SectionHeader
          pretitle="02 . Process"
          title="A clean, predictable workflow."
          description="Our four-phase workflow turns your design intent into a conflict-free, fully documented model on a timeline you can rely on."
          titleId="process-title"
        />
      </div>
      <div className="process__grid">
        {steps.map((step, i) => (
          <div className="process__step" key={step.title}>
            <span className="process__num">{`${String(i + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`}</span>
            <h3 className="process__title">{step.title}</h3>
            <p className="process__desc">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
