import type { Metadata } from "next";
import "./page.css";
import { site } from "@/lib/site-content";
import { MenuProvider } from "@/components/home/MenuContext";
import { ModalProvider } from "@/components/home/ModalContext";
import Preloader from "@/components/home/Preloader";
import Header from "@/components/home/Header";
import MenuOverlay from "@/components/home/MenuOverlay";
import HeroSection from "@/components/home/HeroSection";
import ServicesSection from "@/components/home/ServicesSection";
import ProcessSection from "@/components/home/ProcessSection";
import StatsSection from "@/components/home/StatsSection";
import ProjectsSection from "@/components/home/ProjectsSection";
import ApproachSection from "@/components/home/ApproachSection";
import FaqSection from "@/components/home/FaqSection";
import ContactSection from "@/components/home/ContactSection";
import MaintenanceModal from "@/components/home/MaintenanceModal";
import SiteFooter from "@/components/home/SiteFooter";
import PageObservers from "@/components/home/PageObservers";

export const metadata: Metadata = {
  title: "EcoBIM | BIM Coordination Studio | Model First. Build Once.",
  description: site.meta.description,
  keywords: site.meta.keywords,
  authors: [{ name: "EcoBIM" }],
  robots: "index, follow",
  alternates: { canonical: "https://ecobim.co/" },
  icons: { icon: "/favicon.svg" },
  manifest: "/site.webmanifest",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "EcoBIM",
  description:
    "BIM coordination studio delivering federated 3D models, clash detection, architectural BIM, interior design BIM, quantity takeoff and shop drawings.",
  url: "https://ecobim.co",
  email: "info@ecobim.co",
  serviceType: site.meta.schema_services,
  areaServed: "Worldwide",
  sameAs: [],
};

export default function HomePage() {
  return (
    <MenuProvider>
      <ModalProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <a href="#main-content" className="skip-link">Skip to content</a>

        <Preloader />
        <Header />
        <MenuOverlay />

        <main id="main-content">
          <HeroSection />

          <ServicesSection />
          <div className="section-divider reveal" />

          <ProcessSection />
          <div className="section-divider reveal" />

          <StatsSection />

          <ProjectsSection />
          <div className="section-divider reveal" />

          <ApproachSection />
          <div className="section-divider reveal" />

          <FaqSection />
          <div className="section-divider reveal" />

          <ContactSection />
        </main>

        <MaintenanceModal />
        <SiteFooter />
        <PageObservers />
      </ModalProvider>
    </MenuProvider>
  );
}
