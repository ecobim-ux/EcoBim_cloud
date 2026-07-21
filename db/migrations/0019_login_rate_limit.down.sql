-- ═══════════════════════════════════════════════════════════════════════════
-- Down migration for 0019_login_rate_limit.sql
-- Reverses only what 0019 added — safe to run once 0020's down (if applied)
-- has already run.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

DROP INDEX IF EXISTS iam.ix_login_attempt_ip;
DROP INDEX IF EXISTS iam.ix_login_attempt_login;
DROP POLICY IF EXISTS tenant_isolation ON iam.login_attempt;
DROP TABLE IF EXISTS iam.login_attempt;

COMMIT;
