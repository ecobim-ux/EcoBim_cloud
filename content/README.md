# Content Editing Guide

All site text lives in **`content/site.json`**. Edit the JSON, run the build, done.

## Quick start

```bash
# 1. Edit content/site.json (any text editor)
# 2. Rebuild:
python build.py

# 3. Preview:
python -m http.server 5501
# Open http://localhost:5501
```

## What you can edit in site.json

| Section | JSON key | What it controls |
|---------|----------|-----------------|
| Page title & SEO | `meta` | Browser tab title, Google description, social sharing text |
| Hero | `hero` | Main headline, subtitle, description, CTA buttons |
| Trust bar | `trust_logos` | Client/partner names in the logo strip |
| Hero stats | `hero_stats` | The 4 numbers under the hero (sq ft, clashes, etc.) |
| Services | `services` | Section title + list of 5 service names |
| Process | `process` | 4 workflow steps with titles and descriptions |
| Stats section | `stats_section` | The 4 big numbers on the dark background |
| Projects | `projects.items` | Project cards — name, tag, image path |
| Tools | `tools` | Software list (Revit, Navisworks, etc.) |
| Standards | `standards` | BEP, LOD, IFC descriptions |
| FAQ | `faq` | Questions and answers |
| Contact | `contact` | Section title and description |
| Footer | `footer` | Tagline, copyright year, standards line |
| Form target | `google_sheet_url` | Google Sheets web app URL (see main README) |

## How to edit text

Open `content/site.json` in any text editor (VS Code, Notepad, etc.).

**Rules:**
- Keep the text inside double quotes: `"your text here"`
- Use `&` for ampersand (not `&amp;`)
- Use `–` for en-dash
- Don't delete the commas between items
- After editing, run `python build.py` to apply changes

**Example — change the hero headline:**
```json
"hero": {
    "title_line1": "Your new headline.",
    "title_line2": "Second line here."
}
```

**Example — add a new FAQ:**
```json
"faq": [
    { "question": "Existing question?", "answer": "Existing answer." },
    { "question": "Your new question?", "answer": "Your new answer." }
]
```

**Example — add a new project:**
```json
"projects": {
    "items": [
        {
            "name": "Project Display Name",
            "tag": "Category · LOD Level",
            "image": "images/Your Folder/your-image.webp",
            "alt": "Description for screen readers"
        }
    ]
}
```

---

## Image Guide

### Required image slots

| Slot | Aspect Ratio | Recommended Size | Max File Size | Format |
|------|-------------|-----------------|--------------|--------|
| **Project cards** | 4:3 | 1200 × 900 px | 150 KB | WebP or JPG |

The hero is an inline animated SVG built into `index.html` — no hero image file is needed. Social-share (OG) images are not used on this site.

### How to prepare images

#### Step 1 — Resize

Your images must match the sizes above. Oversized images slow the site.

**Free tools:**
- **Squoosh** (https://squoosh.app) — drag and drop, resize + compress in one step. Best option.
- **Paint** (Windows) — open image → Home → Resize → set width to the pixel value above
- **Photoshop / GIMP** — Image → Image Size → set width, constrain proportions

#### Step 2 — Compress

After resizing, compress to hit the file size target:

- **Squoosh** — set quality to ~80% for WebP, ~85% for JPG
- **TinyPNG** (https://tinypng.com) — drag and drop, handles JPG and PNG
- **WebP format** is 30-50% smaller than JPG at the same quality — prefer it

#### Step 3 — Name and place

1. Create a folder in `images/` for each project (e.g. `images/Project 4/`)
2. Name the file descriptively: `Marina-Bay-Tower.webp`
3. Avoid spaces and special characters in filenames — use hyphens instead
4. Update the `image` path in `site.json`:
   ```json
   "image": "images/Project 4/Marina-Bay-Tower.webp"
   ```

### Hero

The hero is an inline animated SVG (Dynamo node graph + parametric torus) embedded directly in `index.html`. There is no hero image file to manage — edit the SVG markup in `index.html` if you want to change it.
