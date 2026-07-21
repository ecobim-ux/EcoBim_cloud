-- ═══════════════════════════════════════════════════════════════════════════
-- Down migration for 0020_action_rate_limit.sql
-- Reverses only what 0020 added — safe to run as long as 0019 and earlier
-- are still applied (down migrations run in strict reverse order).
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

DROP POLICY IF EXISTS tenant_isolation ON iam.action_attempt;
DROP TABLE IF EXISTS iam.action_attempt;

COMMIT;
