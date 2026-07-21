-- ═══════════════════════════════════════════════════════════════════════════
-- Down migration for 0021_team_member_single_active.sql
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

DROP INDEX IF EXISTS hr.ux_team_member_current_active;

COMMIT;
