"use client";

import { useEffect } from "react";

/** Ports the original vanilla-JS custom cursor (dot + trailing ring) script. */
export function CustomCursor() {
  useEffect(() => {
    const dot = document.getElementById("cursor-dot");
    const ring = document.getElementById("cursor-ring");
    if (!dot || !ring || !window.matchMedia("(hover:hover)").matches) return;

    let rx = 0;
    let ry = 0;
    let tx = 0;
    let ty = 0;
    let raf: number | null = null;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    function loop() {
      rx = lerp(rx, tx, 0.18);
      ry = lerp(ry, ty, 0.18);
      ring!.style.left = rx + "px";
      ring!.style.top = ry + "px";
      if (Math.abs(rx - tx) > 0.5 || Math.abs(ry - ty) > 0.5) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = null;
      }
    }

    function onMove(e: MouseEvent) {
      tx = e.clientX;
      ty = e.clientY;
      dot!.style.left = tx + "px";
      dot!.style.top = ty + "px";
      if (!raf) raf = requestAnimationFrame(loop);
    }

    document.addEventListener("mousemove", onMove);
    return () => {
      document.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div id="cursor-dot" />
      <div id="cursor-ring" />
    </>
  );
}
