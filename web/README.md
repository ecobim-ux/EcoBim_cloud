# EcoBIM Portal

Next.js 15 (App Router) app serving both the public marketing site and the
authenticated project portal (`/portal`), backed by Postgres via Cloudflare
Hyperdrive. See [`../db/README.md`](../db/README.md) for the database schema.

## Getting started

1. Copy the env example files and fill in the real values (ask a teammate,
   or find the connection string in the Cloudflare dashboard under
   Workers & Pages > Hyperdrive):

   ```bash
   cp .env.local.example .env.local
   cp .dev.vars.example .dev.vars
   ```

2. Install dependencies and run the dev server:

   ```bash
   npm install
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) — the marketing site
   is at `/`, the portal at `/portal`.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (unit tests, no DB required) |
| `npm run preview` | Builds and previews via the Cloudflare Workers runtime locally |
| `npm run deploy` | Builds and deploys to Cloudflare Workers |

CI (`.github/workflows/ci.yml`) runs typecheck, lint, test, and build on
every push/PR.

## Security notes

- **CSRF**: state-changing routes rely solely on the session cookie's
  `sameSite: "lax"` attribute (see `lib/server/session.ts`) — there's no
  separate CSRF token. That's a deliberate, currently-adequate choice for a
  same-origin app with no cross-site POST surface, not an oversight; revisit
  if that changes (e.g. a public API consumed cross-origin).
- **Row-Level Security**: the schema defines full tenant-isolation RLS
  policies (`db/migrations/0016`), but the app's database connection must
  actually run as the `ecobim_app` role (not a bypassing/superuser role) for
  those policies to take effect — verify with `select rolbypassrls from
  pg_roles where rolname = current_user` before relying on RLS as a real
  security boundary, not just application-layer `WHERE organization_id = …`
  checks.

## Deployment

This deploys to **Cloudflare Workers** via `@opennextjs/cloudflare`, not
Vercel — see `wrangler.jsonc` and `scripts/patch-wrangler-hyperdrive.cjs`
for why the Hyperdrive binding needs a build-time patch step during deploy.

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [OpenNext Cloudflare adapter](https://opennext.js.org/cloudflare)
