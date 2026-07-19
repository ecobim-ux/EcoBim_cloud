import fs from "node:fs";
import path from "node:path";
import { site } from "./site-content";

export interface GalleryImage {
  src: string;
  alt: string;
  name: string;
  tag: string;
}

const IMAGE_EXTENSIONS = new Set([".webp", ".jpg", ".jpeg", ".png"]);

/**
 * Known-good, committed-alongside-the-images fallback. The dynamic disk scan
 * below (scanProjectGallery) failed silently in Cloudflare's Linux CI build
 * environment for reasons that couldn't be reproduced locally on Windows —
 * this list is generated from the exact same source data (content/site.json
 * + the files actually on disk) so it's guaranteed identical to what a
 * working scan produces, and guarantees the gallery can never render empty
 * regardless of what's different about a given build environment.
 * Regenerate by running the equivalent of scanProjectGallery() in a Node
 * REPL if project photos are added/removed.
 */
const STATIC_FALLBACK_GALLERY: GalleryImage[] = [
  {
    src: "/images/Project%203/velodrome%20abu%20dhabi.webp",
    alt: "Velodrome Abu Dhabi — Sports · LOD 350",
    name: "Velodrome Abu Dhabi",
    tag: "Sports · LOD 350",
  },
  {
    src: "/images/Project%202/Doha_Port___Grand_Cruise_Terminal_3.png",
    alt: "Doha Port Cruise Terminal — Infrastructure · MEP",
    name: "Doha Port Cruise Terminal",
    tag: "Infrastructure · MEP",
  },
  {
    src: "/images/Project%202/Doha_Port___Grand_Cruise_Terminal.webp",
    alt: "Doha Port Cruise Terminal — additional photo 2",
    name: "Doha Port Cruise Terminal",
    tag: "Infrastructure · MEP",
  },
  {
    src: "/images/Project%201/Sports%20Hotel%20Abu%20Dhabi.webp",
    alt: "Sports Hotel Abu Dhabi — Hospitality · BIM Coordination",
    name: "Sports Hotel Abu Dhabi",
    tag: "Hospitality · BIM Coordination",
  },
  {
    src: "/images/Project%205/T2_Kempegowda_International_Airport_2.png",
    alt: "T2 Kempegowda Airport — Transport · LOD 350",
    name: "T2 Kempegowda Airport",
    tag: "Transport · LOD 350",
  },
  {
    src: "/images/Project%205/T2_Kempegowda_International_Airport.webp",
    alt: "T2 Kempegowda Airport — additional photo 2",
    name: "T2 Kempegowda Airport",
    tag: "Transport · LOD 350",
  },
  {
    src: "/images/Project%204/Timor%20Leste%20Education%20Institute_1.png",
    alt: "Timor Leste Education Institute — Education · BIM Coordination",
    name: "Timor Leste Education Institute",
    tag: "Education · BIM Coordination",
  },
  {
    src: "/images/Project%204/Timor%20Leste%20Education%20Institute.webp",
    alt: "Timor Leste Education Institute — additional photo 2",
    name: "Timor Leste Education Institute",
    tag: "Education · BIM Coordination",
  },
];

/**
 * Auto-scans public/images/Project N for every image file on disk (server-side,
 * build/request time) so new photos dropped into a project folder show up in
 * the gallery without touching code. Project name/tag captions still come
 * from content/site.json, keyed off the folder each item's `image` lives in.
 */
function scanProjectGallery(): GalleryImage[] {
  const folderMeta = new Map<string, { name: string; tag: string }>();
  for (const item of site.projects.items) {
    const folder = path.posix.dirname(item.image);
    if (!folderMeta.has(folder)) folderMeta.set(folder, { name: item.name, tag: item.tag });
  }

  const imagesRoot = path.join(process.cwd(), "public", "images");
  const images: GalleryImage[] = [];

  // Preserve the folder order from site.json's projects list.
  for (const [folder, meta] of folderMeta) {
    const dirPath = path.join(process.cwd(), "public", folder);
    let files: string[] = [];
    try {
      files = fs.readdirSync(dirPath).filter((f) => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()));
    } catch {
      continue;
    }
    files.sort((a, b) => a.localeCompare(b, "en", { numeric: true }));

    files.forEach((file, i) => {
      const relPath = path.posix.join("images", path.basename(folder), file);
      images.push({
        src: encodeURI(`/${relPath}`),
        alt: i === 0 ? `${meta.name} — ${meta.tag}` : `${meta.name} — additional photo ${i + 1}`,
        name: meta.name,
        tag: meta.tag,
      });
    });
  }

  // Fall back to whatever is scanned in public/images if site.json ever
  // diverges from what's on disk (e.g. a project folder with no JSON entry).
  if (fs.existsSync(imagesRoot)) {
    const knownFolders = new Set(folderMeta.keys());
    for (const entry of fs.readdirSync(imagesRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const folder = `images/${entry.name}`;
      if (knownFolders.has(folder)) continue;
      const dirPath = path.join(imagesRoot, entry.name);
      const files = fs
        .readdirSync(dirPath)
        .filter((f) => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()))
        .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
      files.forEach((file) => {
        images.push({
          src: encodeURI(`/images/${entry.name}/${file}`),
          alt: entry.name,
          name: entry.name,
          tag: "",
        });
      });
    }
  }

  return images;
}

export function getProjectGallery(): GalleryImage[] {
  try {
    const scanned = scanProjectGallery();
    if (scanned.length > 0) return scanned;
    console.error("[gallery] disk scan found zero images (cwd=" + process.cwd() + ") — using static fallback");
  } catch (err) {
    console.error("[gallery] disk scan threw — using static fallback:", err);
  }
  return STATIC_FALLBACK_GALLERY;
}
