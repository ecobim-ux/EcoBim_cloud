-- ═══════════════════════════════════════════════════════════════════════════
-- EcoBIM ERP · 0002 · core: organizations, org structure, lookups, sequences
--
-- STANDARD COLUMN BLOCK — repeated on every business table:
--   organization_id  uuid NOT NULL → core.organization   (tenant scope)
--   created_at/updated_at timestamptz, created_by/updated_by uuid
--   deleted_at timestamptz (soft delete), row_version int (optimistic lock)
-- created_by/updated_by carry user_account ids but are deliberately NOT
-- foreign keys: audit provenance must survive account deletion and must
-- not add write-path index overhead. Append-only tables carry a reduced
-- block (created_* only) — they are never updated or soft-deleted.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

CREATE TABLE core.organization (
  id           uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  code         citext NOT NULL,
  name         text   NOT NULL,
  timezone     text   NOT NULL DEFAULT 'Asia/Dubai',
  status       text   NOT NULL DEFAULT 'ACTIVE'
               CHECK (status IN ('ACTIVE','SUSPENDED','ARCHIVED')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  created_by   uuid,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  updated_by   uuid,
  deleted_at   timestamptz,
  row_version  integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_organization_code ON core.organization (code) WHERE deleted_at IS NULL;

CREATE TABLE core.company (
  id               uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id  uuid NOT NULL REFERENCES core.organization(id),
  code             citext NOT NULL,
  name             text NOT NULL,
  legal_name       text,
  trade_license    text,               -- UAE trade license no.
  currency         char(3) NOT NULL DEFAULT 'AED',
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_company_code ON core.company (organization_id, code) WHERE deleted_at IS NULL;
CREATE INDEX ix_company_org ON core.company (organization_id);

CREATE TABLE core.branch (
  id               uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id  uuid NOT NULL REFERENCES core.organization(id),
  company_id       uuid NOT NULL REFERENCES core.company(id),
  code             citext NOT NULL,
  name             text NOT NULL,
  city             text,
  country          char(2) NOT NULL DEFAULT 'AE',
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_branch_code ON core.branch (company_id, code) WHERE deleted_at IS NULL;
CREATE INDEX ix_branch_org ON core.branch (organization_id);
CREATE INDEX ix_branch_company ON core.branch (company_id);

CREATE TABLE core.department (
  id               uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id  uuid NOT NULL REFERENCES core.organization(id),
  company_id       uuid NOT NULL REFERENCES core.company(id),
  branch_id        uuid REFERENCES core.branch(id),
  code             citext NOT NULL,
  name             text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_department_code ON core.department (company_id, code) WHERE deleted_at IS NULL;
CREATE INDEX ix_department_org ON core.department (organization_id);
CREATE INDEX ix_department_company ON core.department (company_id);
CREATE INDEX ix_department_branch ON core.department (branch_id);

-- ─── Controlled vocabularies ───────────────────────────────────────────────
-- Two mechanisms, by design:
--  · Hot, code-driving statuses get their own tiny tables in their module
--    (work.task_status, bim.rfi_status, …) → direct FKs, UI metadata, and
--    referential integrity that a shared table cannot give.
--  · Extensible vocabularies (phases, LOD, deliverable types, disciplines,
--    work types, project/doc types) live here. organization_id NULL = global
--    seed row; orgs may add their own values.
CREATE TABLE core.lookup_type (
  code        text PRIMARY KEY,
  label       text NOT NULL,
  description text
);

CREATE TABLE core.lookup_value (
  id               uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  type_code        text NOT NULL REFERENCES core.lookup_type(code),
  organization_id  uuid REFERENCES core.organization(id),   -- NULL = global
  code             text NOT NULL,
  label            text NOT NULL,
  sort_order       integer NOT NULL DEFAULT 0,
  color            text,
  is_active        boolean NOT NULL DEFAULT true,
  meta             jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_lookup_value_global
  ON core.lookup_value (type_code, code) WHERE organization_id IS NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX ux_lookup_value_org
  ON core.lookup_value (organization_id, type_code, code) WHERE organization_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_lookup_value_type ON core.lookup_value (type_code) WHERE deleted_at IS NULL;

-- Shared priority scale (tasks, RFIs, issue severity) — colors from the UI.
CREATE TABLE core.priority (
  code       text PRIMARY KEY,
  label      text NOT NULL,
  sort_order integer NOT NULL,
  color      text NOT NULL
);

-- ─── Human-readable business code series (REQ-, RFI-, ISS-, APR-, …) ──────
CREATE TABLE core.sequence_registry (
  organization_id uuid NOT NULL REFERENCES core.organization(id),
  series          text NOT NULL,
  last_value      bigint NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, series)
);

-- Atomic, gapless-enough allocator: SELECT core.next_code(org,'RFI','RFI-',3)
CREATE OR REPLACE FUNCTION core.next_code(p_org uuid, p_series text, p_prefix text, p_pad int DEFAULT 4)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE v bigint;
BEGIN
  INSERT INTO core.sequence_registry (organization_id, series, last_value)
  VALUES (p_org, p_series, 1)
  ON CONFLICT (organization_id, series)
  DO UPDATE SET last_value = core.sequence_registry.last_value + 1
  RETURNING last_value INTO v;
  RETURN p_prefix || lpad(v::text, p_pad, '0');
END $$;

CREATE TABLE core.system_setting (
  id               uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id  uuid REFERENCES core.organization(id),   -- NULL = platform default
  key              text NOT NULL,
  value            jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_system_setting_global ON core.system_setting (key) WHERE organization_id IS NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX ux_system_setting_org ON core.system_setting (organization_id, key) WHERE organization_id IS NOT NULL AND deleted_at IS NULL;

CREATE TABLE core.feature_flag (
  id               uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id  uuid REFERENCES core.organization(id),
  key              text NOT NULL,
  enabled          boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_feature_flag_global ON core.feature_flag (key) WHERE organization_id IS NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX ux_feature_flag_org ON core.feature_flag (organization_id, key) WHERE organization_id IS NOT NULL AND deleted_at IS NULL;

COMMIT;
