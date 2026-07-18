interface SectionHeaderProps {
  pretitle: string;
  title: string;
  description?: string;
  titleId?: string;
  dark?: boolean;
}

export default function SectionHeader({ pretitle, title, description, titleId, dark }: SectionHeaderProps) {
  return (
    <div className="section-head">
      <div className="c-header" style={dark ? { color: "rgba(255,255,255,.5)" } : undefined}>
        <span className="c-square" />
        <span className="t-pretitle reveal">{pretitle}</span>
      </div>
      <h2 className="t-h2 reveal" id={titleId} data-mask style={dark ? { color: "#fff" } : undefined}>
        <span className="mask-line">
          <span className="mask-inner">{title}</span>
          <span className="mask-sweep" aria-hidden="true" />
        </span>
      </h2>
      {description ? (
        <p className={`t-body reveal${dark ? " section-head__desc--dark" : ""}`} data-delay="1">
          {description}
        </p>
      ) : null}
    </div>
  );
}
