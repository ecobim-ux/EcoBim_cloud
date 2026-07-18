"use client";

import { useEffect, useState } from "react";
import { useMenu } from "./MenuContext";
import { useMaintenanceModal } from "./ModalContext";

const NAV_LINKS = [
  { href: "#services", label: "Services" },
  { href: "#process", label: "Process" },
  { href: "#projects", label: "Work" },
  { href: "#approach", label: "Standards" },
  { href: "#contact", label: "Contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const { isOpen, toggle, triggerRef } = useMenu();
  const { open: openModal, loginBtnRef } = useMaintenanceModal();

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 30);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="page__header" id="site-header">
      <nav className={`nav${scrolled ? " nav--scrolled" : ""}`} id="main-nav">
        <a href="#top" className="nav__logo" aria-label="EcoBIM home">
          <span>Eco</span>BIM
        </a>
        <ul className="nav__links" role="list">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="link--underline">{link.label}</a>
            </li>
          ))}
        </ul>
        <div className="nav__right">
          <button
            className="button button--solid nav__login"
            id="client-login-btn"
            aria-label="Client login"
            ref={loginBtnRef}
            onClick={openModal}
          >
            <span className="button__text">
              <span className="button__text--sp">Client Login</span>
              <span className="button__text--sp button__text--sp--clone">Client Login</span>
            </span>
            <svg
              className="nav__login-icon"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
            </svg>
          </button>
          <button
            className="menu__trigger"
            id="menu-trigger"
            aria-label="Open menu"
            aria-expanded={isOpen}
            ref={triggerRef}
            onClick={toggle}
          >
            <span className="menu__label">Menu</span>
            <span className="menu__icon" aria-hidden="true">
              <span className="menu__icon--line" />
              <span className="menu__icon--line" />
            </span>
          </button>
        </div>
      </nav>
    </header>
  );
}
