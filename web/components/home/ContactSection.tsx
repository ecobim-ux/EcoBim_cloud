import { site } from "@/lib/site-content";
import ContactForm from "./ContactForm";

export default function ContactSection() {
  const { contact } = site;

  return (
    <section className="cta-band pt--xlarge pb--xlarge" id="contact" aria-labelledby="contact-title">
      <div className="grid-pattern grid-pattern--dark" aria-hidden="true" />
      <div style={{ padding: "0 var(--margin)" }}>
        <div style={{ paddingBottom: "3rem", borderBottom: "1px solid rgba(255,255,255,.1)" }}>
          <div className="c-header" style={{ color: "rgba(255,255,255,.4)" }}>
            <span className="c-square" />
            <span className="t-pretitle">05 . Contact</span>
          </div>
        </div>
        <div className="contact__grid" style={{ marginTop: "3rem" }}>
          <div className="contact__info">
            <h2 className="t-h2 reveal" id="contact-title" data-mask style={{ color: "#fff" }}>
              <span className="mask-line">
                <span className="mask-inner">{contact.title}</span>
                <span className="mask-sweep" aria-hidden="true" />
              </span>
            </h2>
            <p style={{ fontSize: "1rem", lineHeight: 1.7, color: "rgba(255,255,255,.55)", maxWidth: "28em" }} className="reveal" data-delay="1">
              {contact.description}
            </p>
            <div className="contact__detail reveal" data-delay="2">
              <span className="contact__detail-label">Email</span>
              <a href="mailto:info@ecobim.co" className="contact__detail-val link--underline">info@ecobim.co</a>
            </div>
            <div className="contact__detail reveal" data-delay="3">
              <span className="contact__detail-label">Standards</span>
              <span className="contact__detail-val">{contact.standards_line}</span>
            </div>
            <div className="contact__detail reveal" data-delay="4">
              <span className="contact__detail-label">Response time</span>
              <span className="contact__detail-val">{contact.response_time}</span>
            </div>
            <div className="reveal" data-delay="5">
              <a href="mailto:info@ecobim.co" className="button button--ghost-light">
                <span className="button__text">
                  <span className="button__text--sp">Email us</span>
                  <span className="button__text--sp button__text--sp--clone">Sending…</span>
                </span>
              </a>
            </div>
          </div>

          <div className="contact__form-col">
            <h2 className="t-h2 reveal" data-mask style={{ color: "#fff" }}>
              <span className="mask-line">
                <span className="mask-inner">Request estimate</span>
                <span className="mask-sweep" aria-hidden="true" />
              </span>
            </h2>
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
