-- ═══════════════════════════════════════════════════════════════════════════
-- EcoBIM ERP · 0019 · Login attempt log — backs POST /api/auth/login rate
-- limiting. Append-only; Workers are stateless/ephemeral so an in-memory
-- counter can't survive across requests — this is the durable equivalent.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

CREATE TABLE iam.login_attempt (
  id               uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id  uuid NOT NULL REFERENCES core.organization(id),
  login_id         text NOT NULL,
  ip_address       text,
  succeeded        boolean NOT NULL,
  attempted_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_login_attempt_login ON iam.login_attempt (organization_id, login_id, attempted_at);
CREATE INDEX ix_login_attempt_ip ON iam.login_attempt (organization_id, ip_address, attempted_at);

ALTER TABLE iam.login_attempt ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON iam.login_attempt FOR ALL TO ecobim_app
  USING (organization_id = core.current_org_id())
  WITH CHECK (organization_id = core.current_org_id());
GRANT SELECT, INSERT ON iam.login_attempt TO ecobim_app;

COMMIT;
