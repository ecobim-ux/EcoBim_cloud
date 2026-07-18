import { site } from "@/lib/site-content";
import { HERO_SVG_MARKUP } from "./heroSvgMarkup";
import HeroSvgInteractive from "./HeroSvgInteractive";

export default function HeroSection() {
  const hero = site.hero;

  return (
    <section className="hero" id="top" aria-label="EcoBIM BIM coordination studio">
      <div className="grid-pattern" aria-hidden="true" />
      <div className="h-lines" aria-hidden="true">
        <div className="h-line h-line--v" style={{ left: "8.33%" }} />
        <div className="h-line h-line--v" style={{ right: "8.33%" }} />
        <div className="h-line h-line--h" style={{ top: 0 }} />
      </div>

      <div className="hero__eyebrow">
        <div className="c-header">
          <span className="c-square" />
          <span className="t-pretitle">{hero.eyebrow}</span>
        </div>
        <div className="hero__solution-box">
          <span className="hero__solution-dot" />
          {hero.solution_line}
        </div>
      </div>

      <div className="hero__copy">
        <h1 className="hero__title t-hero">
          <span className="mask-line" id="hero-line-1">
            <span className="mask-inner">{hero.title_line1}</span>
            <span className="mask-sweep" aria-hidden="true" />
          </span>
          <span className="mask-line" id="hero-line-2">
            <span className="mask-inner">{hero.title_line2}</span>
            <span className="mask-sweep" aria-hidden="true" />
          </span>
        </h1>
        <div className="hero__lead">
          <p
            className="t-body"
            style={{ fontSize: "1.05rem", lineHeight: 1.65, color: "rgb(var(--grey-400))", maxWidth: "36em" }}
          >
            {hero.description}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "flex-end" }}>
            <a href="#contact" className="button button--solid">
              <span className="button__text">
                <span className="button__text--sp">{hero.cta_primary}</span>
                <span className="button__text--sp button__text--sp--clone">{hero.cta_primary}</span>
              </span>
              <span className="button__icon__inner" aria-hidden="true">↗</span>
            </a>
            <a href="#services" className="button button--ghost">
              <span className="button__text">
                <span className="button__text--sp">{hero.cta_secondary}</span>
                <span className="button__text--sp button__text--sp--clone">{hero.cta_secondary}</span>
              </span>
              <span className="button__icon__inner" aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
      </div>

      <div
        className="hero__media"
        role="img"
        aria-label="Animated Dynamo script for a parametric stadium roof: input sliders, ellipse boundary nodes and a Python node wired through surface lofting to structural ribs and supports, with the resulting elliptical roof structure and coordination readouts"
        dangerouslySetInnerHTML={{ __html: HERO_SVG_MARKUP }}
      />
      <HeroSvgInteractive />
    </section>
  );
}
