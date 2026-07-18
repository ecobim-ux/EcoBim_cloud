import { getProjectGallery } from "@/lib/gallery";
import ProjectGallery from "./ProjectGallery";
import SectionHeader from "./SectionHeader";

export default function ProjectsSection() {
  const images = getProjectGallery();

  return (
    <section style={{ padding: "5rem var(--margin)" }} id="projects" aria-labelledby="projects-title">
      <div style={{ paddingBottom: "3rem", borderBottom: "1px solid rgba(12,11,17,.1)" }}>
        <SectionHeader
          pretitle="03 . Work"
          title="Coordinated on every kind of project."
          description="We've coordinated commercial towers, healthcare campuses, logistics warehouses and residential schemes from concept through to handover."
          titleId="projects-title"
        />
      </div>

      <div style={{ marginTop: "3rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <ProjectGallery images={images} />

        <a href="#contact" className="project__cta" style={{ padding: "3rem 2rem" }}>
          <span className="project__cta-title">Your project could be next.</span>
          <span className="project__cta-sub">Tell us about it and we&apos;ll scope the model within a business day.</span>
          <span
            className="button__text"
            style={{ fontWeight: 600, fontSize: ".8rem", letterSpacing: ".01em", textTransform: "uppercase", color: "rgb(var(--white))", marginTop: ".5rem" }}
          >
            Get started ↗
          </span>
        </a>
      </div>
    </section>
  );
}
