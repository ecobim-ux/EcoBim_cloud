"use client";

import { useEffect, useRef } from "react";
import { useMenu } from "./MenuContext";

const PRIMARY_LINKS = [
  { href: "#services", label: "Services" },
  { href: "#process", label: "Process" },
  { href: "#projects", label: "Work" },
  { href: "#approach", label: "Standards" },
  { href: "#contact", label: "Contact" },
];

export default function MenuOverlay() {
  const { isOpen, close, triggerRef } = useMenu();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.classList.toggle("menu--opened", isOpen);
    document.body.style.overflow = isOpen ? "hidden" : "";
  }, [isOpen]);

  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "Tab" && isOpen && containerRef.current) {
        const focusable = containerRef.current.querySelectorAll<HTMLElement>("a[href], button");
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          triggerRef.current?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          triggerRef.current?.focus();
        }
      }
    }
    document.addEventListener("keydown", onKeydown);
    return () => document.removeEventListener("keydown", onKeydown);
  }, [isOpen, close, triggerRef]);

  return (
    <>
      <div
        className="menu__back"
        id="menu-back"
        aria-hidden="true"
        onClick={close}
      />
      <div
        className="menu__container"
        id="menu-container"
        aria-hidden={!isOpen}
        role="dialog"
        aria-label="Navigation menu"
        ref={containerRef}
      >
        <nav className="menu__primary" aria-label="Main navigation">
          {PRIMARY_LINKS.map((link) => (
            <div className="main__menu__item" key={link.href}>
              <a href={link.href} className="menu__item__link" onClick={close}>
                <span className="t-menu">
                  <span className="mask">
                    <span>{link.label}</span>
                  </span>
                </span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          ))}
        </nav>
        <div className="menu__secondary">
          <div className="menu__secondary__column">
            <span className="t-label" style={{ color: "rgb(var(--grey-300))", marginBottom: ".5rem" }}>
              Studio
            </span>
            <a href="#approach" onClick={close}>About EcoBIM</a>
            <a href="#projects" onClick={close}>Case studies</a>
            <a href="#contact" onClick={close}>Get estimate</a>
          </div>
          <div className="menu__secondary__column">
            <span className="t-label" style={{ color: "rgb(var(--grey-300))", marginBottom: ".5rem" }}>
              Contact
            </span>
            <a href="mailto:info@ecobim.co" onClick={close}>info@ecobim.co</a>
            <a href="#contact" onClick={close}>Request a call</a>
          </div>
        </div>
      </div>
    </>
  );
}
