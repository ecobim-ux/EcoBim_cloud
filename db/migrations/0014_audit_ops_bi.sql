-- ═══════════════════════════════════════════════════════════════════════════
-- EcoBIM ERP · 0014 · audit, ops, bi
-- audit_log is append-only, monthly-partitioned, populated by a generic row
-- trigger (attached to curated tables in 0016). Actor/request come from the
-- app.user_id / app.request_id session settings.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

CREATE TABLE audit.audit_log (
  id              uuid NOT NULL DEFAULT core.uuid_v7(),
  organization_id uuid,
  occurred_at     timestamptz NOT NULL DEFAULT now(),
  actor_user_id   uuid,
  action          text NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  table_schema    text NOT NULL,
  table_name      text NOT NULL,
  row_id          uuid,
  before_data     jsonb,
  after_data      jsonb,
  request_id      text,
  PRIMARY KEY (id, occurred_at)
) PARTITION BY RANGE (occurred_at);

CREATE TABLE audit.audit_log_default PARTITION OF audit.audit_log DEFAULT;

CREATE INDEX ix_audit_log_row ON audit.audit_log (table_name, row_id, occurred_at);
CREATE INDEX ix_audit_log_actor ON audit.audit_log (actor_user_id, occurred_at);
CREATE INDEX brin_audit_log_time ON audit.audit_log USING brin (occurred_at);

-- Generic row-audit trigger. SECURITY DEFINER so the app role can write
-- audit rows without direct INSERT permission on audit_log.
CREATE OR REPLACE FUNCTION audit.tg_row_audit()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, audit, core
AS $$
DECLARE
  v_before jsonb;
  v_after  jsonb;
  v_row_id uuid;
  v_org    uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_after := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_before := to_jsonb(OLD);
    v_after  := to_jsonb(NEW);
  ELSE
    v_before := to_jsonb(OLD);
  END IF;
  v_row_id := coalesce((v_after ->> 'id')::uuid, (v_before ->> 'id')::uuid);
  v_org    := coalesce((v_after ->> 'organization_id')::uuid, (v_before ->> 'organization_id')::uuid);

  INSERT INTO audit.audit_log
    (organization_id, actor_user_id, action, table_schema, table_name, row_id, before_data, after_data, request_id)
  VALUES
    (v_org, core.current_user_id(), TG_OP, TG_TABLE_SCHEMA, TG_TABLE_NAME, v_row_id, v_before, v_after,
     nullif(current_setting('app.request_id', true), ''));

  RETURN coalesce(NEW, OLD);
END $$;

-- User-facing "recent activity" (denormalized from domain events for cheap
-- reads; the audit log stays the forensic source of truth).
CREATE TABLE audit.activity_feed (
  id             uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id uuid NOT NULL REFERENCES core.organization(id),
  actor_party_id uuid REFERENCES party.party(id),
  verb           text NOT NULL,             -- "completed_task", "raised_issue", …
  summary        text NOT NULL,
  target_kind    text,
  target_id      uuid,
  project_id     uuid REFERENCES proj.project(id),
  occurred_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_activity_feed_org ON audit.activity_feed (organization_id, occurred_at DESC);
CREATE INDEX ix_activity_feed_project ON audit.activity_feed (project_id, occurred_at DESC);

-- Background jobs: reminder dispatch, RFI SLA sweeps, snapshot computation,
-- outbox delivery, report generation.
CREATE TABLE ops.job_queue (
  id          uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id uuid REFERENCES core.organization(id),
  kind        text NOT NULL,
  payload     jsonb NOT NULL DEFAULT '{}'::jsonb,
  run_at      timestamptz NOT NULL DEFAULT now(),
  status      text NOT NULL DEFAULT 'QUEUED'
              CHECK (status IN ('QUEUED','RUNNING','DONE','FAILED')),
  attempts    integer NOT NULL DEFAULT 0,
  last_error  text,
  locked_by   text,
  locked_at   timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid,
  row_version integer NOT NULL DEFAULT 1
);
CREATE INDEX ix_job_queue_ready ON ops.job_queue (run_at) WHERE status = 'QUEUED';
CREATE INDEX ix_job_queue_kind ON ops.job_queue (kind, status);

-- The four canned reports + params; runs reference the generated artifact.
CREATE TABLE bi.report_definition (
  id              uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id uuid REFERENCES core.organization(id),   -- NULL = global
  code            text NOT NULL,
  name            text NOT NULL,
  description     text,
  params_schema   jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_report_definition_global ON bi.report_definition (code) WHERE organization_id IS NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX ux_report_definition_org ON bi.report_definition (organization_id, code) WHERE organization_id IS NOT NULL AND deleted_at IS NULL;

CREATE TABLE bi.report_run (
  id                   uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id      uuid NOT NULL REFERENCES core.organization(id),
  definition_id        uuid NOT NULL REFERENCES bi.report_definition(id),
  requested_by         uuid,
  params               jsonb NOT NULL DEFAULT '{}'::jsonb,
  status               text NOT NULL DEFAULT 'QUEUED'
                       CHECK (status IN ('QUEUED','RUNNING','DONE','FAILED')),
  started_at           timestamptz,
  finished_at          timestamptz,
  artifact_document_id uuid REFERENCES dms.document(id),
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE INDEX ix_report_run_def ON bi.report_run (definition_id, created_at DESC);

COMMIT;
