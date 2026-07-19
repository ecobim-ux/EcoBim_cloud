// Runs automatically via package.json's "postinstall" — after every
// `npm install`/`npm ci`, including Cloudflare's own CI build.
//
// `opennextjs-cloudflare deploy` always calls Wrangler's local platform-proxy
// (for an internal cache-population check) even during a genuine production
// deploy, and that call hard-requires the Hyperdrive binding to have a
// `localConnectionString` — there's no config flag to skip it. Since the
// real connection string must never be committed to this public repo, this
// script injects it into the (uncommitted, CI-ephemeral) wrangler.jsonc at
// build time, sourced from a Cloudflare dashboard secret.
//
// Local dev: harmless no-op unless you export the same env var yourself.
const fs = require("fs");
const path = require("path");

const CONN = process.env.CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE;
if (!CONN) {
  console.log("[patch-wrangler-hyperdrive] env var not set, skipping (fine for normal local installs)");
  process.exit(0);
}

const wranglerPath = path.join(__dirname, "..", "wrangler.jsonc");
let raw = fs.readFileSync(wranglerPath, "utf8");

if (raw.includes('"localConnectionString"')) {
  console.log("[patch-wrangler-hyperdrive] localConnectionString already present, skipping");
  process.exit(0);
}

// Drop the "intentionally omitted" explanatory comment block — it would be
// factually wrong once the field is actually injected below it.
const withoutStaleComment = raw.replace(
  /\n\s*\/\/ localConnectionString intentionally omitted[\s\S]*?\(see db\/README\.md for why this is needed during deploy\)\.\s*\n/,
  "\n",
);

const patched = withoutStaleComment.replace(
  /("binding":\s*"HYPERDRIVE",\s*\n\s*"id":\s*"[^"]+")/,
  `$1,\n\t\t\t"localConnectionString": ${JSON.stringify(CONN)}`,
);

if (patched === withoutStaleComment) {
  console.error("[patch-wrangler-hyperdrive] could not find the HYPERDRIVE binding to patch — check wrangler.jsonc's shape");
  process.exit(1);
}

fs.writeFileSync(wranglerPath, patched);
console.log("[patch-wrangler-hyperdrive] injected localConnectionString into wrangler.jsonc for this build only");
