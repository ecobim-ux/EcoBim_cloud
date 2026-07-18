import { site } from "@/lib/site-content";
import FaqAccordion from "./FaqAccordion";
import SectionHeader from "./SectionHeader";

export default function FaqSection() {
  return (
    <section style={{ padding: "5rem var(--margin)" }} id="faq" aria-labelledby="faq-title">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "start" }} className="faq-layout">
        <SectionHeader pretitle="Questions" title="Common questions." titleId="faq-title" />
        <FaqAccordion items={site.faq} />
      </div>
    </section>
  );
}
