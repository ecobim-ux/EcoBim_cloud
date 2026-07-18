import { site } from "@/lib/site-content";
import SectionHeader from "./SectionHeader";

export default function ServicesSection() {
  const { services } = site;

  return (
    <section className="section" id="services" aria-labelledby="services-title">
      <div style={{ padding: "5rem var(--margin) 0" }}>
        <div style={{ paddingBottom: "3rem", borderBottom: "1px solid rgba(12,11,17,.1)" }}>
          <SectionHeader
            pretitle="01 . Services"
            title="From model to fabrication."
            description="Our six core capabilities take your project from design intent to a coordinated, buildable set, fully documented and audit-ready."
            titleId="services-title"
          />
        </div>
      </div>

      <div className="solutions__list" style={{ margin: "0 var(--margin)" }}>
        {services.items.map((name, i) => (
          <a href="#contact" className="solutions__item" key={name}>
            <span className="solutions__num">{String(i + 1).padStart(2, "0")}</span>
            <span className="solutions__name">{name}</span>
            <span className="solutions__arrow">↗</span>
          </a>
        ))}
      </div>

      <div
        style={{
          padding: "2.5rem var(--margin)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "2rem",
          borderTop: "1px solid rgba(12,11,17,.08)",
        }}
      >
        <p
          style={{
            fontStyle: "italic",
            fontSize: "1.1rem",
            color: "rgb(var(--grey-400))",
            maxWidth: "32em",
            lineHeight: 1.6,
          }}
        >
          Not sure what you need? Send drawings or an IFC and we&apos;ll scope the model, LOD and deliverables within a business day.
        </p>
        <a href="#contact" className="button button--ghost">
          <span className="button__text">
            <span className="button__text--sp">Talk to us</span>
            <span className="button__text--sp button__text--sp--clone">Talk to us</span>
          </span>
          <span className="button__icon__inner" aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  );
}
