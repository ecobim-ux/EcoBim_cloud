import { autoClashes, formatNumber, site } from "@/lib/site-content";
import SectionHeader from "./SectionHeader";

export default function StatsSection() {
  const items = site.stats_section.items;
  const clashes = `${formatNumber(autoClashes())}+`;

  return (
    <section className="stats pt--xlarge pb--xlarge" id="stats" aria-labelledby="stats-title">
      <div className="grid-pattern grid-pattern--dark" aria-hidden="true" />
      <div style={{ padding: "0 var(--margin)" }}>
        <div style={{ paddingBottom: "3rem" }}>
          <SectionHeader
            pretitle="Impact"
            title="Numbers that matter on site."
            description="Every metric here comes directly from our project data. No estimates, no rounding."
            titleId="stats-title"
            dark
          />
        </div>
        <div className="stats__grid">
          {items.map((stat, i) => (
            <div className="stat__item" key={stat.label} style={i > 0 ? { transitionDelay: `.${i}s` } : undefined}>
              <span className="stat__val" data-count={stat.auto ? undefined : stat.value} data-suffix={stat.auto ? undefined : stat.suffix} data-auto={stat.auto}>
                {stat.auto ? clashes : stat.display}
              </span>
              <span className="stat__label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
