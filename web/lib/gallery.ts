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
 * Auto-scans public/images/Project N for every image file on disk (server-side,
 * build/request time) so new photos dropped into a project folder show up in
 * the gallery without touching code. Project name/tag captions still come
 * from content/site.json, keyed off the folder each item's `image` lives in.
 */
export function getProjectGallery(): GalleryImage[] {
  const folderMeta = new Map<string, { name: string; tag: string }>();
  for (const item of site.projects.items) {
    const folder = path.dirname(item.image);
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
      const relPath = path.posix.join("images", path.basename(folder), file).replace(/\\/g, "/");
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
