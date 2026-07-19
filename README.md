# EcoBIM — BIM Coordination Studio

Static marketing website for EcoBIM. Built as a single self-contained HTML file — no build step, no dependencies, no server required. Drop the folder onto any static host.

## Quick start

```bash
# Local preview
python -m http.server 5501
# Open http://localhost:5501
```

## Deploy to GitHub Pages

1. Push this folder to a GitHub repo
2. Go to **Settings → Pages**
3. Source: **Deploy from a branch** → select `main` → root `/`
4. Your site will be live at `https://<username>.github.io/<repo-name>/`

For a custom domain, add a `CNAME` file with your domain (e.g. `ecobim.co`) and configure DNS per [GitHub docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).

## Deploy to Vercel / Netlify

Just connect the repo — no config needed. The `vercel.json` is already present.

## Connect contact form to Google Sheets

### Step 1 — Create the Sheet

1. Create a new Google Sheet
2. Name the first sheet `Enquiries`
3. Add headers in row 1: `Timestamp | Name | Email | Project | Message`

### Step 2 — Create the Apps Script

1. In the Sheet, go to **Extensions → Apps Script**
2. Replace the code with:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Enquiries');
  var data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    data.timestamp || new Date().toISOString(),
    data.name || '',
    data.email || '',
    data.project || '',
    data.message || ''
  ]);
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. Click **Deploy → New deployment**
4. Type: **Web app**
5. Execute as: **Me**
6. Who has access: **Anyone**
7. Click **Deploy** and copy the web app URL

### Step 3 — Paste the URL

Open `index.html` and find this line near the top of the `<script>` block:

```javascript
var GOOGLE_SHEET_URL = ''; // paste your Apps Script web app URL here
```

Paste your URL between the quotes:

```javascript
var GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/ABC.../exec';
```

That's it — form submissions will now appear in your Google Sheet. The form falls back to `mailto:info@ecobim.co` until a URL is set.

## File structure

```
├── index.html          Main site (single file, all CSS + JS inline; hero is an inline animated SVG)
├── favicon.svg         Site icon
├── privacy.html        Privacy policy
├── terms.html          Redirects to privacy.html
├── robots.txt          Crawler directives
├── sitemap.xml         Sitemap
├── site.webmanifest    PWA manifest
├── vercel.json         Vercel config
├── build.py            Optional: rebuilds index.html text from content/site.json
├── content/
│   ├── site.json       All editable site text (see content/README.md)
│   └── README.md       Content editing guide
└── images/
    ├── Project 1/      Sports Hotel Abu Dhabi
    ├── Project 2/      Doha Port Cruise Terminal
    ├── Project 3/      Velodrome Abu Dhabi
    ├── Project 4/      Timor Leste Education Institute
    └── Project 5/      T2 Kempegowda Airport
```

## Tech

- Zero dependencies — vanilla HTML/CSS/JS
- Fonts: Inter, JetBrains Mono, Newsreader (Google Fonts CDN)
- Animations: CSS transitions + IntersectionObserver
- SEO: JSON-LD schema, Open Graph, Twitter Card, canonical URL, semantic HTML
- Accessibility: ARIA labels, keyboard navigation, prefers-reduced-motion
