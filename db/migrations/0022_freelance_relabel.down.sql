-- ═══════════════════════════════════════════════════════════════════════════
-- Down migration for 0022_freelance_relabel.sql
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

UPDATE wf.workflow_stage
SET label = 'Sent to Client'
WHERE code = 'SENT_TO_CLIENT' AND label = 'Sent to Freelance';

COMMIT;
