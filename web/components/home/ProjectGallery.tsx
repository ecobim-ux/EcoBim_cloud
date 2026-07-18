"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { GalleryImage } from "@/lib/gallery";

export default function ProjectGallery({ images }: { images: GalleryImage[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const revealImgRef = useRef<HTMLImageElement>(null);
  const vLineRef = useRef<HTMLDivElement>(null);
  const hLineRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  if (!images.length) return null;
  const active = images[activeIndex];

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    if (revealImgRef.current) revealImgRef.current.style.clipPath = `inset(0 ${100 - x}% ${100 - y}% 0)`;
    if (vLineRef.current) vLineRef.current.style.transform = `translateX(${e.clientX - rect.left}px)`;
    if (hLineRef.current) hLineRef.current.style.transform = `translateY(${e.clientY - rect.top}px)`;
    if (labelRef.current) {
      const px = Math.round(e.clientX - rect.left);
      const py = Math.round(e.clientY - rect.top);
      labelRef.current.textContent = `${px} : ${py}`;
      let lx = e.clientX - rect.left + 10;
      let ly = e.clientY - rect.top + 10;
      if (lx > rect.width - 90) lx -= 110;
      if (ly > rect.height - 30) ly -= 30;
      labelRef.current.style.left = `${lx}px`;
      labelRef.current.style.top = `${ly}px`;
    }
  }

  function onMouseLeave() {
    if (revealImgRef.current) revealImgRef.current.style.clipPath = "inset(0 90% 90% 0)";
  }

  return (
    <div className="gallery reveal">
      <div className="gallery__big cross-image" onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
        <Image
          key={active.src}
          src={active.src}
          alt={active.alt}
          fill
          sizes="(max-width: 900px) 100vw, 900px"
          style={{ objectFit: "cover" }}
          priority={activeIndex === 0}
        />
        <Image
          key={`${active.src}-reveal`}
          src={active.src}
          alt=""
          aria-hidden="true"
          fill
          sizes="(max-width: 900px) 100vw, 900px"
          className="cross-image__img"
          style={{ objectFit: "cover" }}
          ref={revealImgRef}
        />
        <div className="cross-image__lines">
          <div className="cross-image__v" ref={vLineRef} />
          <div className="cross-image__h" ref={hLineRef} />
        </div>
        <span className="cross-image__label" ref={labelRef} />
        <div className="project__info" style={{ opacity: 1, transform: "none" }}>
          <div className="project__meta">
            <span className="project__name">{active.name}</span>
            <span className="project__tag">{active.tag}</span>
          </div>
        </div>
      </div>
      <div className="gallery__thumbs" role="listbox" aria-label="Project photos">
        {images.map((img, i) => (
          <button
            type="button"
            key={img.src}
            className={`gallery__thumb${i === activeIndex ? " active" : ""}`}
            onClick={() => setActiveIndex(i)}
            role="option"
            aria-selected={i === activeIndex}
            aria-label={img.alt}
          >
            <Image src={img.src} alt="" fill sizes="160px" style={{ objectFit: "cover" }} />
          </button>
        ))}
      </div>
    </div>
  );
}
