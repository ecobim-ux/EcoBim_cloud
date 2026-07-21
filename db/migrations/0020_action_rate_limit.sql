-- ═══════════════════════════════════════════════════════════════════════════
-- EcoBIM ERP · 0020 · Generic action-attempt log — backs rate limiting on
-- write endpoints beyond login (notifications, meetings, tasks, issues).
-- Same durable-counter pattern as iam.login_attempt (0019): Workers are
-- stateless/ephemeral, so an in-memory counter can't survive across
-- requests or isolates — every attempt is logged here and checked with a
-- sliding-window count instead.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

CREATE TABLE iam.action_attempt (
  id               uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id  uuid NOT NULL REFERENCES core.organization(id),
  user_account_id  uuid NOT NULL REFERENCES iam.user_account(id),
  action_code      text NOT NULL,
  attempted_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_action_attempt_user_action ON iam.action_attempt (organization_id, user_account_id, action_code, attempted_at);

-- Attempts are only ever appended to and counted over a recent window —
-- nothing needs to keep them past that window, so a cheap unlogged cleanup
-- is safe to run periodically (not scheduled here; see lib/server/rate-limit.ts).

ALTER TABLE iam.action_attempt ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON iam.action_attempt FOR ALL TO ecobim_app
  USING (organization_id = core.current_org_id())
  WITH CHECK (organization_id = core.current_org_id());
GRANT SELECT, INSERT, DELETE ON iam.action_attempt TO ecobim_app;

COMMIT;
