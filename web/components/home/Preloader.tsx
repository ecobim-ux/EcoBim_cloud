"use client";

import { useEffect, useRef } from "react";

/** Ports the original inline script's preloader + hero "page-in" boot sequence. */
export default function Preloader() {
  const preloaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const preloader = preloaderRef.current;

    function removePreloader() {
      document.body.classList.add("preload--out");
      setTimeout(() => {
        if (preloader) preloader.style.display = "none";
      }, 1100);
    }

    let fired = false;
    function fire() {
      if (fired) return;
      fired = true;
      document.body.classList.add("page--in");
      setTimeout(() => {
        document.querySelectorAll<HTMLElement>(".h-line").forEach((el) => {
          el.style.transition = "opacity 1.4s ease";
          el.style.opacity = "0.07";
        });
      }, 80);
      ["hero-line-1", "hero-line-2"].forEach((id, i) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (prefersReduced) {
          const inner = el.querySelector<HTMLElement>(".mask-inner");
          if (inner) inner.style.opacity = "1";
          return;
        }
        setTimeout(() => el.classList.add("animated--line"), 200 + i * 220);
      });
    }

    removePreloader();
    const t = setTimeout(fire, 80);
    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(fire);
    });

    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  return (
    <>
      <div className="preload" id="preloader" aria-hidden="true" ref={preloaderRef}>
        <div className="preload__back" />
        <div className="preload__top" />
        <div className="preload__bottom" />
        <div className="preload__logo"><span>Eco</span>BIM</div>
      </div>
      <div className="transition__layer" id="transition-layer" />
    </>
  );
}
