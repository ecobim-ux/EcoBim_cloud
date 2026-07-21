-- ═══════════════════════════════════════════════════════════════════════════
-- EcoBIM ERP · 0022 · Rename the "Client" portal label to "Freelance".
-- Pure UI rename per product decision — the CLIENT role code, crm.client_*
-- tables and iam.role.name stay untouched (internal identifiers only). The
-- one place display text is stored in the database rather than hardcoded in
-- the frontend is wf.workflow_stage.label for SENT_TO_CLIENT, which the
-- approvals UI renders directly — relabel it to match.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

UPDATE wf.workflow_stage
SET label = 'Sent to Freelance'
WHERE code = 'SENT_TO_CLIENT' AND label = 'Sent to Client';

COMMIT;
