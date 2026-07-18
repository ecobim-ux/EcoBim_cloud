import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./legal.css";

export const metadata: Metadata = {
  title: "Privacy & Terms — EcoBIM",
  description: "EcoBIM privacy policy and terms of service.",
  robots: "index, follow",
  alternates: { canonical: "https://ecobim.co/privacy" },
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0C0B11",
};

export default function PrivacyPage() {
  return (
    <>
      <div className="bar">
        <Link className="brand" href="/">
          <span>Eco</span>BIM
        </Link>
        <Link className="back" href="/">&larr; Back to website</Link>
      </div>
      <main>
        <h1>Privacy &amp; Terms</h1>
        <p className="meta">Last updated: 22 June 2026</p>

        <h2>Privacy Policy</h2>

        <h3>1. Information we collect</h3>
        <p>We collect information you provide directly — such as your name, email, company and project details when you submit our contact form or use the project portal. We may also collect basic technical data (browser type, pages visited) to operate and improve the Site.</p>

        <h3>2. How we use your information</h3>
        <ul>
          <li>To respond to enquiries and provide our services</li>
          <li>To administer client and team access to the project portal</li>
          <li>To communicate project updates, RFIs and approvals</li>
          <li>To maintain the security and performance of the Site</li>
        </ul>

        <h3>3. Data storage</h3>
        <p>The project portal stores certain working data (such as task and approval state) locally in your browser to provide its functionality. Information you send via the contact form is delivered by your own email client to EcoBIM.</p>

        <h3>4. Sharing</h3>
        <p>We do not sell your personal data. We share information only as needed to deliver our services, comply with the law, or protect our rights.</p>

        <h3>5. Cookies &amp; tracking</h3>
        <p>The Site uses only the storage necessary to operate. If analytics or marketing cookies are added in future, this policy will be updated and consent obtained where required.</p>

        <h3>6. Your rights</h3>
        <p>Subject to applicable law, you may request access to, correction of, or deletion of your personal data. Contact us to exercise these rights.</p>

        <hr className="divider" />

        <h2>Terms of Service</h2>

        <h3>1. Acceptance of terms</h3>
        <p>By accessing the EcoBIM website (the &ldquo;Site&rdquo;) or the project portal, you agree to be bound by these Terms of Service. If you do not agree, please do not use the Site or portal.</p>

        <h3>2. Services</h3>
        <p>EcoBIM provides BIM coordination services including federated 3D modelling, clash detection, 4D/5D scheduling, quantity takeoff and shop drawings. The scope, deliverables and timelines of any engagement are defined in a separate written agreement between EcoBIM and the client.</p>

        <h3>3. Portal access &amp; accounts</h3>
        <p>Access to the project portal is granted to authorised clients and team members only. You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account. Notify us promptly of any unauthorised use.</p>

        <h3>4. Intellectual property</h3>
        <p>All models, drawings and deliverables produced under an engagement are governed by the terms of the relevant project agreement. Site content, branding and design remain the property of EcoBIM unless otherwise stated.</p>

        <h3>5. Acceptable use</h3>
        <p>You agree not to misuse the Site or portal, attempt unauthorised access, disrupt service, or upload unlawful or harmful content.</p>

        <h3>6. Limitation of liability</h3>
        <p>To the maximum extent permitted by law, EcoBIM is not liable for indirect or consequential losses arising from use of the Site or portal. Professional liability for project deliverables is governed by the applicable project agreement.</p>

        <h3>7. Changes to these terms</h3>
        <p>We may update these Terms from time to time. Continued use of the Site or portal after changes take effect constitutes acceptance of the revised Terms.</p>

        <hr className="divider" />

        <p>Questions? Email <a href="mailto:info@ecobim.co">info@ecobim.co</a>.</p>
      </main>
      <footer>
        <span>&copy; 2026 EcoBIM &mdash; BIM Coordination Studio</span>
        <a href="mailto:info@ecobim.co">info@ecobim.co</a>
      </footer>
    </>
  );
}
