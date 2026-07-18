-- ═══════════════════════════════════════════════════════════════════════════
-- EcoBIM ERP · 0012 · dms: folders, documents, versions, blobs, links
-- Document states follow ISO 19650 CDE conventions (WIP/SHARED/PUBLISHED/
-- ARCHIVED) — the login page advertises ISO 19650, so the CDE model is a
-- first-class requirement, not gold-plating.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

CREATE TABLE dms.doc_state (
  code       text PRIMARY KEY,
  label      text NOT NULL,
  sort_order integer NOT NULL
);

CREATE TABLE dms.folder (
  id               uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id  uuid NOT NULL REFERENCES core.organization(id),
  project_id       uuid NOT NULL REFERENCES proj.project(id),
  parent_folder_id uuid REFERENCES dms.folder(id),
  name             text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
-- PG15+: NULLS NOT DISTINCT so two root-level folders can't share a name.
CREATE UNIQUE INDEX ux_folder_name ON dms.folder (project_id, parent_folder_id, name)
  NULLS NOT DISTINCT WHERE deleted_at IS NULL;
CREATE INDEX ix_folder_parent ON dms.folder (parent_folder_id) WHERE deleted_at IS NULL;

-- Physical content, deduplicated by hash. storage_key points at the object
-- store (S3-compatible); the DB never holds file bytes.
CREATE TABLE dms.file_blob (
  id              uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id uuid NOT NULL REFERENCES core.organization(id),
  sha256          char(64) NOT NULL,
  byte_size       bigint NOT NULL CHECK (byte_size >= 0),
  mime_type       text NOT NULL,
  storage_key     text NOT NULL,
  scan_status     text NOT NULL DEFAULT 'PENDING' CHECK (scan_status IN ('PENDING','CLEAN','INFECTED')),
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_file_blob_hash ON dms.file_blob (organization_id, sha256) WHERE deleted_at IS NULL;

CREATE TABLE dms.document (
  id                 uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id    uuid NOT NULL REFERENCES core.organization(id),
  code               citext NOT NULL,                     -- DOC-000001
  project_id         uuid NOT NULL REFERENCES proj.project(id),
  folder_id          uuid REFERENCES dms.folder(id),
  title              text NOT NULL,                       -- "Dubai Marina Tower — CD Set"
  doc_type_id        uuid REFERENCES core.lookup_value(id),   -- DRAWINGS/MODEL/REPORT
  discipline_id      uuid REFERENCES core.lookup_value(id),
  state_code         text NOT NULL DEFAULT 'WIP' REFERENCES dms.doc_state(code),
  client_visible     boolean NOT NULL DEFAULT false,      -- gates the client Docs tab
  current_version_id uuid,                                -- FK added below
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_document_code ON dms.document (organization_id, code) WHERE deleted_at IS NULL;
CREATE INDEX ix_document_project ON dms.document (project_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_document_client_visible ON dms.document (project_id) WHERE client_visible AND deleted_at IS NULL;
CREATE INDEX ix_document_title_trgm ON dms.document USING gin (title gin_trgm_ops);

CREATE TABLE dms.document_version (
  id            uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id uuid NOT NULL REFERENCES core.organization(id),
  document_id   uuid NOT NULL REFERENCES dms.document(id),
  version_label text NOT NULL,                            -- "v4.2", "Rev B"
  file_blob_id  uuid NOT NULL REFERENCES dms.file_blob(id),
  change_note   text,
  published_by  uuid,
  published_at  timestamptz,                              -- immutable once set
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_document_version ON dms.document_version (document_id, version_label) WHERE deleted_at IS NULL;

ALTER TABLE dms.document
  ADD CONSTRAINT fk_document_current_version
  FOREIGN KEY (current_version_id) REFERENCES dms.document_version(id);

-- Deferred FK from 0010 (model versions bind to published document versions).
ALTER TABLE bim.model_version
  ADD CONSTRAINT fk_model_version_document
  FOREIGN KEY (document_version_id) REFERENCES dms.document_version(id);

-- Explicit link rows (one nullable FK per target + exactly-one CHECK) —
-- referential integrity that generic polymorphism cannot give.
CREATE TABLE dms.document_link (
  id                   uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id      uuid NOT NULL REFERENCES core.organization(id),
  document_id          uuid NOT NULL REFERENCES dms.document(id),
  task_id              uuid REFERENCES work.task(id),
  rfi_id               uuid REFERENCES bim.rfi(id),
  issue_id             uuid REFERENCES bim.issue(id),
  milestone_id         uuid REFERENCES proj.milestone(id),
  workflow_instance_id uuid REFERENCES wf.workflow_instance(id),
  CHECK (num_nonnulls(task_id, rfi_id, issue_id, milestone_id, workflow_instance_id) = 1),
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE INDEX ix_document_link_document ON dms.document_link (document_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_document_link_task ON dms.document_link (task_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_document_link_rfi ON dms.document_link (rfi_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_document_link_issue ON dms.document_link (issue_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_document_link_milestone ON dms.document_link (milestone_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_document_link_wfi ON dms.document_link (workflow_instance_id) WHERE deleted_at IS NULL;

COMMIT;
