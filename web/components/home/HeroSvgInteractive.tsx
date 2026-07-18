"use client";

import { useEffect } from "react";

interface Item {
  el: SVGGraphicsElement;
  baseX: number;
  baseY: number;
  dx: number;
  dy: number;
  dead: boolean;
}

interface Wire {
  el: SVGPathElement;
  origD: string | null;
  sx: number;
  sy: number;
  ex: number;
  ey: number;
  from: Item | null;
  to: Item | null;
}

/**
 * Ports the original inline script's hero-SVG behavior 1:1: responsive
 * viewBox swap on mobile, and — for fine-pointer/hover devices only — the
 * drag-to-move / connect / delete / double-click-to-edit node editor.
 */
export default function HeroSvgInteractive() {
  useEffect(() => {
    const heroSvg = document.getElementById("hero-svg") as unknown as SVGSVGElement | null;
    if (!heroSvg) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: Array<() => void> = [];

    // ── responsive viewBox ──
    const heroMq = window.matchMedia("(max-width: 680px)");
    const setHeroView = () => {
      heroSvg.setAttribute("viewBox", heroMq.matches ? "0 0 800 960" : "0 0 1600 686");
    };
    if (heroMq.addEventListener) heroMq.addEventListener("change", setHeroView);
    else heroMq.addListener(setHeroView);
    window.addEventListener("resize", setHeroView, { passive: true });
    setHeroView();
    cleanups.push(() => {
      if (heroMq.removeEventListener) heroMq.removeEventListener("change", setHeroView);
      else heroMq.removeListener(setHeroView);
      window.removeEventListener("resize", setHeroView);
    });

    // ── node editor (fine pointers with hover only) ──
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches && !prefersReduced) {
      const SVGNS = "http://www.w3.org/2000/svg";
      const items: Item[] = [];
      heroSvg.querySelectorAll<SVGGraphicsElement>("g.h-fadeUp").forEach((el) => {
        const t = el.getAttribute("transform") || "";
        const m = t.match(/translate\(\s*(-?[\d.]+)[ ,]+(-?[\d.]+)/);
        items.push({ el, baseX: m ? +m[1] : 0, baseY: m ? +m[2] : 0, dx: 0, dy: 0, dead: false });
      });
      const torusEl = heroSvg.querySelector<SVGGraphicsElement>(".hero-torus");
      if (torusEl) items.push({ el: torusEl, baseX: 1250, baseY: 212, dx: 0, dy: 0, dead: false });

      const boxes = items.map((it) => {
        const b = it.el.getBBox();
        return { x: b.x + it.baseX, y: b.y + it.baseY, w: b.width, h: b.height };
      });

      function ownerOf(x: number, y: number): Item | null {
        for (let i = 0; i < boxes.length; i++) {
          if (items[i].dead) continue;
          const b = boxes[i];
          const it = items[i];
          if (x >= b.x + it.dx - 5 && x <= b.x + b.w + it.dx + 5 && y >= b.y + it.dy - 5 && y <= b.y + b.h + it.dy + 5) return it;
        }
        return null;
      }

      let wires: Wire[] = [];
      heroSvg.querySelectorAll<SVGPathElement>("path.h-draw").forEach((p) => {
        if (torusEl && torusEl.contains(p)) return;
        const m = (p.getAttribute("d") || "").match(
          /^M([-\d.]+),([-\d.]+)\s*C[-\d.]+,[-\d.]+\s+[-\d.]+,[-\d.]+\s+([-\d.]+),([-\d.]+)$/
        );
        if (!m) return;
        let to = ownerOf(+m[3], +m[4]);
        if (!to && +m[3] > 740 && torusEl) to = items[items.length - 1];
        wires.push({ el: p, origD: p.getAttribute("d"), sx: +m[1], sy: +m[2], ex: +m[3], ey: +m[4], from: ownerOf(+m[1], +m[2]), to });
      });

      function wireD(sx: number, sy: number, ex: number, ey: number) {
        const mx = Math.max(20, Math.abs(ex - sx) * 0.5) * (ex >= sx ? 1 : -1);
        return `M${sx},${sy} C${sx + mx},${sy} ${ex - mx},${ey} ${ex},${ey}`;
      }

      function updateWires(item: Item) {
        wires.forEach((w) => {
          if (w.from !== item && w.to !== item) return;
          w.el.style.animation = "none";
          w.el.style.strokeDasharray = "none";
          const sx = w.sx + (w.from ? w.from.dx : 0);
          const sy = w.sy + (w.from ? w.from.dy : 0);
          const ex = w.ex + (w.to ? w.to.dx : 0);
          const ey = w.ey + (w.to ? w.to.dy : 0);
          w.el.setAttribute("d", wireD(sx, sy, ex, ey));
        });
      }

      function svgPoint(e: PointerEvent | MouseEvent) {
        const pt = heroSvg!.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        return pt.matrixTransform(heroSvg!.getScreenCTM()!.inverse());
      }

      // ── selection + delete ──
      let selected: { kind: "node"; ref: Item } | { kind: "wire"; ref: Wire } | null = null;
      function deselect() {
        if (!selected) return;
        if (selected.kind === "node") selected.ref.el.style.outline = "";
        else {
          selected.ref.el.style.filter = "";
          selected.ref.el.style.strokeWidth = "";
        }
        selected = null;
      }
      function selectNode(item: Item) {
        deselect();
        selected = { kind: "node", ref: item };
        item.el.style.outline = "2px dashed rgb(255,89,73)";
      }
      function selectWire(w: Wire) {
        deselect();
        selected = { kind: "wire", ref: w };
        w.el.style.strokeWidth = "3";
        w.el.style.filter = "drop-shadow(0 0 2px rgba(255,89,73,.8))";
      }
      function deleteSelected() {
        if (!selected) return;
        if (selected.kind === "node") {
          const item = selected.ref;
          wires = wires.filter((w) => {
            if (w.from === item || w.to === item) {
              w.el.remove();
              return false;
            }
            return true;
          });
          item.el.remove();
          item.dead = true;
        } else {
          const w = selected.ref;
          wires = wires.filter((x) => x !== w);
          w.el.remove();
        }
        selected = null;
      }
      function onKeydown(e: KeyboardEvent) {
        const tag = (document.activeElement || {}).tagName || "";
        if (/INPUT|TEXTAREA/.test(tag)) return;
        if ((e.key === "Delete" || e.key === "Backspace") && selected) {
          e.preventDefault();
          deleteSelected();
        }
        if (e.key === "Escape") deselect();
      }
      document.addEventListener("keydown", onKeydown);
      cleanups.push(() => document.removeEventListener("keydown", onKeydown));

      function onSvgClick(e: MouseEvent) {
        if (e.target === heroSvg) deselect();
      }
      heroSvg.addEventListener("click", onSvgClick);
      cleanups.push(() => heroSvg.removeEventListener("click", onSvgClick));

      function hookWire(w: Wire) {
        w.el.style.pointerEvents = "stroke";
        w.el.style.cursor = "pointer";
        w.el.addEventListener("click", (ev) => {
          ev.stopPropagation();
          selectWire(w);
        });
      }
      wires.forEach(hookWire);

      // ── connect: drag from a port circle to another node ──
      function startConnect(item: Item, e: PointerEvent) {
        e.preventDefault();
        e.stopPropagation();
        const start = svgPoint(e);
        const temp = document.createElementNS(SVGNS, "path");
        temp.setAttribute("fill", "none");
        temp.setAttribute("stroke", "rgb(255,89,73)");
        temp.setAttribute("stroke-width", "1.5");
        temp.setAttribute("stroke-dasharray", "5,4");
        temp.setAttribute("opacity", ".6");
        if (torusEl) heroSvg!.insertBefore(temp, torusEl);
        else heroSvg!.appendChild(temp);
        temp.setAttribute("d", wireD(start.x, start.y, start.x, start.y));
        function mv(ev: PointerEvent) {
          const p = svgPoint(ev);
          temp.setAttribute("d", wireD(start.x, start.y, p.x, p.y));
        }
        function up(ev: PointerEvent) {
          document.removeEventListener("pointermove", mv);
          document.removeEventListener("pointerup", up);
          const p = svgPoint(ev);
          const target = ownerOf(p.x, p.y);
          if (target && target !== item) {
            temp.setAttribute("stroke-dasharray", "none");
            temp.setAttribute("opacity", ".4");
            const w: Wire = {
              el: temp,
              origD: temp.getAttribute("d"),
              sx: start.x - item.dx,
              sy: start.y - item.dy,
              ex: p.x - target.dx,
              ey: p.y - target.dy,
              from: item,
              to: target,
            };
            wires.push(w);
            hookWire(w);
          } else {
            temp.remove();
          }
        }
        document.addEventListener("pointermove", mv);
        document.addEventListener("pointerup", up);
      }

      // ── move + click-select ──
      items.forEach((item) => {
        item.el.style.cursor = "grab";
        item.el.addEventListener("pointerdown", (e) => {
          if ((e.target as Element).tagName === "circle" && (e.target as Element).parentNode === item.el) {
            startConnect(item, e);
            return;
          }
          e.preventDefault();
          item.el.style.animation = "none";
          item.el.style.opacity = "1";
          const start = svgPoint(e);
          const ox = item.dx;
          const oy = item.dy;
          let moved = false;
          try {
            item.el.setPointerCapture(e.pointerId);
          } catch {
            /* noop */
          }
          item.el.style.cursor = "grabbing";
          function move(ev: PointerEvent) {
            const p = svgPoint(ev);
            item.dx = ox + (p.x - start.x);
            item.dy = oy + (p.y - start.y);
            if (Math.abs(item.dx - ox) + Math.abs(item.dy - oy) > 3) moved = true;
            item.el.style.transform = `translate(${item.baseX + item.dx}px,${item.baseY + item.dy}px)`;
            updateWires(item);
          }
          function up() {
            item.el.style.cursor = "grab";
            item.el.removeEventListener("pointermove", move);
            item.el.removeEventListener("pointerup", up);
            item.el.removeEventListener("pointercancel", up);
            if (!moved) selectNode(item);
          }
          item.el.addEventListener("pointermove", move);
          item.el.addEventListener("pointerup", up);
          item.el.addEventListener("pointercancel", up);
        });
      });

      // ── double-click to edit any text ──
      const host = document.querySelector<HTMLElement>(".hero__media");
      function onDblClick(e: MouseEvent) {
        const t = e.target as Element;
        if (t.tagName !== "text" && t.tagName !== "tspan") return;
        if (!host) return;
        e.preventDefault();
        const r = t.getBoundingClientRect();
        const hr = host.getBoundingClientRect();
        const inp = document.createElement("input");
        inp.type = "text";
        inp.value = t.textContent || "";
        inp.style.cssText = `position:absolute;z-index:6;left:${r.left - hr.left - 3}px;top:${r.top - hr.top - 3}px;min-width:${Math.max(r.width + 40, 120)}px;font-family:'JetBrains Mono',monospace;font-size:${Math.max(r.height, 11)}px;background:#FAF9F6;color:rgb(12,11,17);border:1px solid rgb(255,89,73);border-radius:2px;padding:2px 4px;outline:none;`;
        host.appendChild(inp);
        inp.focus();
        inp.select();
        let done = false;
        function commit() {
          if (done) return;
          done = true;
          t.textContent = inp.value;
          inp.remove();
        }
        function cancel() {
          if (done) return;
          done = true;
          inp.remove();
        }
        inp.addEventListener("keydown", (ev) => {
          ev.stopPropagation();
          if (ev.key === "Enter") commit();
          if (ev.key === "Escape") cancel();
        });
        inp.addEventListener("blur", commit);
      }
      heroSvg.addEventListener("dblclick", onDblClick);
      cleanups.push(() => heroSvg.removeEventListener("dblclick", onDblClick));

      // ── reset editor state if viewport drops to mobile layout ──
      const dragMq = window.matchMedia("(max-width: 680px)");
      function resetDrag() {
        if (!dragMq.matches) return;
        deselect();
        items.forEach((it) => {
          it.dx = 0;
          it.dy = 0;
          if (!it.dead) it.el.style.transform = "";
        });
        wires.forEach((w) => {
          if (w.origD) w.el.setAttribute("d", w.origD);
        });
      }
      if (dragMq.addEventListener) dragMq.addEventListener("change", resetDrag);
      else dragMq.addListener(resetDrag);
      cleanups.push(() => {
        if (dragMq.removeEventListener) dragMq.removeEventListener("change", resetDrag);
        else dragMq.removeListener(resetDrag);
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
