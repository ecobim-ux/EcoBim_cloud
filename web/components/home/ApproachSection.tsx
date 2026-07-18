import { site } from "@/lib/site-content";
import SectionHeader from "./SectionHeader";

export default function ApproachSection() {
  const { tools, standards } = site;

  return (
    <section style={{ padding: "5rem var(--margin)" }} id="approach" aria-labelledby="approach-title">
      <div style={{ paddingBottom: "3rem" }}>
        <SectionHeader
          pretitle="04 . Standards & Tools"
          title="Documented, auditable, compliant."
          description="We work in industry-standard software and proven frameworks, and we hold the same rigor on every engagement."
          titleId="approach-title"
        />
      </div>

      <div className="approach__grid">
        <div>
          <h3 className="t-h3 reveal" style={{ marginBottom: "1.5rem" }}>Software we work in.</h3>
          <div className="tools-list">
            {tools.map((tool, i) => (
              <div className="tool-row reveal" data-delay={i > 0 && i < 5 ? i : undefined} key={tool.name}>
                <span>
                  {tool.name}{" "}
                  {tool.ext.split(" ").map((ext, i, arr) => (
                    <span key={ext}>
                      <span className="tool-ext">{ext}</span>
                      {i < arr.length - 1 ? " " : ""}
                    </span>
                  ))}
                </span>
                <span className="tool-cat">{tool.category}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="t-h3 reveal" style={{ marginBottom: "1.5rem" }}>Standards we hold.</h3>
          <div>
            {standards.map((std) => (
              <div className="std__item" key={std.tag}>
                <span className="std__tag">{std.tag}</span>
                <p className="std__desc">{std.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
