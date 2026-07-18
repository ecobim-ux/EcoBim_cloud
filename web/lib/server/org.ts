import "server-only";

/**
 * This deployment is single-tenant (one company, EcoBIM) even though the
 * schema is multi-tenant-ready. RLS policies require `app.org_id` to already
 * be set before any query runs, which makes looking up "which org does this
 * login belong to" from the database impossible without it (chicken-and-egg).
 * Hardcoding the one org this deployment serves sidesteps that cleanly —
 * revisit if this ever needs to serve multiple organizations.
 */
export const ECOBIM_ORG_ID = "019f772a-73d3-7e70-bd16-75b2d55d1462";
