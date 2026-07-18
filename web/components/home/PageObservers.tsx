"use client";

import { useEffect } from "react";

const REVEAL_SELECTOR = ".reveal, .process__step, .stat__item, .std__item, .section-divider";

/**
 * Ports the scroll-driven parts of the original inline script that aren't
 * owned by a specific widget component: section title mask-wipe, footer
 * wordmark mask-wipe, scroll-reveal, nav-hiding footer intersection, and
 * smooth-scroll for in-page anchor links.
 */
export default function PageObservers() {
  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function fireReveal(el: Element) {
      el.classList.add("in-view");
    }

    let revealObs: IntersectionObserver | undefined;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

    if (!prefersReduced) {
      revealObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              fireReveal(entry.target);
              revealObs?.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
      );
      document.querySelectorAll(REVEAL_SELECTOR).forEach((el) => revealObs?.observe(el));

      fallbackTimer = setTimeout(() => {
        document.querySelectorAll(REVEAL_SELECTOR).forEach((el, i) => {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight + 100) {
            setTimeout(() => fireReveal(el), i * 50);
          }
        });
      }, 600);
    } else {
      document.querySelectorAll(REVEAL_SELECTOR).forEach((el) => fireReveal(el));
    }

    // ── section title mask-wipe ──
    let maskObs: IntersectionObserver | undefined;
    if (!prefersReduced) {
      maskObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.querySelectorAll(".mask-line").forEach((line, i) => {
              setTimeout(() => line.classList.add("animated--line"), i * 180);
            });
            maskObs?.unobserve(entry.target);
          });
        },
        { threshold: 0.15 }
      );
      document.querySelectorAll("[data-mask]").forEach((el) => maskObs?.observe(el));
    } else {
      document.querySelectorAll(".mask-inner").forEach((el) => {
        (el as HTMLElement).style.opacity = "1";
      });
    }

    // ── footer wordmark mask-wipe ──
    let footerWordObs: IntersectionObserver | undefined;
    if (!prefersReduced) {
      const footerMask = document.querySelector("[data-footer-mask]");
      if (footerMask) {
        footerWordObs = new IntersectionObserver(
          (entries) => {
            if (!entries[0].isIntersecting) return;
            entries[0].target.classList.add("animated--line");
            footerWordObs?.disconnect();
          },
          { threshold: 0.2 }
        );
        footerWordObs.observe(footerMask);
      }
    }

    // ── footer-in → hide nav ──
    let footerObs: IntersectionObserver | undefined;
    const footer = document.getElementById("site-footer");
    if (footer) {
      footerObs = new IntersectionObserver(
        (entries) => {
          document.body.classList.toggle("footer--in", entries[0].isIntersecting);
        },
        { threshold: 0.01 }
      );
      footerObs.observe(footer);
    }

    // ── smooth scroll for in-page anchors ──
    function onDocClick(e: MouseEvent) {
      const a = (e.target as HTMLElement)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;
      const id = a.getAttribute("href")?.slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: prefersReduced ? "auto" : "smooth" });
    }
    document.addEventListener("click", onDocClick);

    return () => {
      revealObs?.disconnect();
      maskObs?.disconnect();
      footerWordObs?.disconnect();
      footerObs?.disconnect();
      document.removeEventListener("click", onDocClick);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, []);

  return null;
}
