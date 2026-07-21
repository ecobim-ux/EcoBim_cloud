"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { GalleryImage } from "@/lib/gallery";

interface Project {
  id: string;
  src: string;
  alt: string;
  name: string;
  tag: string;
  category: string;
}

function dedupeProjects(images: GalleryImage[]): Project[] {
  const seen = new Set<string>();
  const projects: Project[] = [];
  for (const img of images) {
    if (seen.has(img.id)) continue;
    seen.add(img.id);
    projects.push({
      id: img.id,
      src: img.src,
      alt: img.alt,
      name: img.name,
      tag: img.tag,
      category: img.tag.split("·")[0]?.trim() || "Other",
    });
  }
  return projects;
}

export default function ProjectGallery({ images }: { images: GalleryImage[] }) {
  const projects = useMemo(() => dedupeProjects(images), [images]);
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of projects) counts.set(p.category, (counts.get(p.category) || 0) + 1);
    return Array.from(counts.entries());
  }, [projects]);

  const [activeCategory, setActiveCategory] = useState("All");
  const filtered = activeCategory === "All" ? projects : projects.filter((p) => p.category === activeCategory);

  const [activeId, setActiveId] = useState(projects[0]?.id);
  const active = filtered.some((p) => p.id === activeId) ? activeId : filtered[0]?.id;

  if (!projects.length) return null;

  const activeBasis = filtered.length <= 1 ? 100 : 70;
  const collapsedBasis = filtered.length > 1 ? (100 - activeBasis) / (filtered.length - 1) : 0;

  return (
    <div className="reveal">
      <div className="gallery-filters" role="tablist" aria-label="Filter projects by category">
        <button
          type="button"
          role="tab"
          aria-selected={activeCategory === "All"}
          className={`gallery-filter${activeCategory === "All" ? " active" : ""}`}
          onClick={() => setActiveCategory("All")}
        >
          All <span className="gallery-filter__count">{projects.length}</span>
        </button>
        {categories.map(([category, count]) => (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={activeCategory === category}
            className={`gallery-filter${activeCategory === category ? " active" : ""}`}
            onClick={() => setActiveCategory(category)}
          >
            {category} <span className="gallery-filter__count">{count}</span>
          </button>
        ))}
      </div>

      <div className="gallery">
        {filtered.map((p, i) => (
          <button
            type="button"
            key={p.id}
            className={`gallery__panel${p.id === active ? " active" : ""}`}
            style={{ flexBasis: `${p.id === active ? activeBasis : collapsedBasis}%` }}
            onMouseEnter={() => setActiveId(p.id)}
            onFocus={() => setActiveId(p.id)}
            onClick={() => setActiveId(p.id)}
            aria-label={`${p.name} — ${p.tag}`}
          >
            <Image
              src={p.src}
              alt={p.alt}
              fill
              sizes="(max-width: 760px) 100vw, 1200px"
              style={{ objectFit: "cover" }}
              priority={i === 0}
            />
            <span className="gallery__collapsed-label" aria-hidden="true">
              <span>{p.name}</span>
            </span>
            <div className="gallery__info">
              <span className="project__tag">{p.tag}</span>
              <span className="project__name">{p.name}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
