import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="footer" id="site-footer">
      <div className="footer__wordmark">
        <span className="mask-line" data-footer-mask>
          <span className="mask-inner"><span>Eco</span>BIM</span>
          <span className="mask-sweep" aria-hidden="true" />
        </span>
      </div>
      <div className="footer__inner">
        <div>
          <p className="footer__tag">
            We deliver BIM modeling &amp; coordination for the construction and real-estate industries. Model first. Build once.
          </p>
        </div>
        <div className="footer__cols">
          <div>
            <p className="footer__col-head">Services</p>
            <div className="footer__col-links">
              <a href="#services">3D Modeling</a>
              <a href="#services">Clash Coordination</a>
              <a href="#services">Architectural BIM</a>
              <a href="#services">Interior Design BIM</a>
              <a href="#services">Takeoff</a>
              <a href="#services">Shop Drawings</a>
            </div>
          </div>
          <div>
            <p className="footer__col-head">Studio</p>
            <div className="footer__col-links">
              <a href="#process">Our process</a>
              <a href="#projects">Projects</a>
              <a href="#approach">Standards</a>
              <a href="#approach">Software</a>
            </div>
          </div>
          <div>
            <p className="footer__col-head">Get started</p>
            <div className="footer__col-links">
              <a href="#contact">Request estimate</a>
              <a href="#contact">Contact us</a>
              <a href="mailto:info@ecobim.co">info@ecobim.co</a>
            </div>
          </div>
        </div>
      </div>
      <div className="footer__base">
        <span>© 2026 EcoBIM · BIM Coordination Studio</span>
        <span>LOD 100–400 · BEP · IFC Delivery</span>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <Link href="/privacy" className="link--underline" style={{ color: "inherit" }}>Privacy &amp; Terms</Link>
        </div>
      </div>
    </footer>
  );
}
