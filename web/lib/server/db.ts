import "server-only";
import postgres from "postgres";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Cloudflare Workers can't hold long-lived TCP connections across requests,
 * so a fresh postgres.js client is created per request against the
 * Hyperdrive-pooled connection string. Hyperdrive does the actual pooling
 * at the edge — this is the documented pattern for Workers + Postgres.
 * `prepare: false` because Hyperdrive terminates prepared statements
 * per-connection, not safe to rely on across pooled connections.
 */
export async function getDb() {
  const { env } = await getCloudflareContext({ async: true });
  const hyperdrive = env.HYPERDRIVE;
  if (!hyperdrive) {
    throw new Error("HYPERDRIVE binding not configured — check wrangler.jsonc and .dev.vars");
  }
  return postgres(hyperdrive.connectionString, {
    max: 5,
    fetch_types: false,
    prepare: false,
  });
}
