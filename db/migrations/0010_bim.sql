-- ═══════════════════════════════════════════════════════════════════════════
-- EcoBIM ERP · 0010 · bim: RFIs, issues (+event trail), models, clashes
-- Issue escalation is a LINK (issue → spawned issue) + an event row, not a
-- title-prefixed copy as in the frontend. Issue/RFI responses are threaded.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

CREATE TABLE bim.rfi_status (
  code       text PRIMARY KEY,
  label      text NOT NULL,
  sort_order integer NOT NULL,
  color      text
);

CREATE TABLE bim.issue_status (
  code       text PRIMARY KEY,
  label      text NOT NULL,
  sort_order integer NOT NULL,
  color      text
);

-- Clash scaffolding first (issue references clash_item).
CREATE TABLE bim.clash_set (
  id              uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id uuid NOT NULL REFERENCES core.organization(id),
  project_id      uuid NOT NULL REFERENCES proj.project(id),
  name            text NOT NULL,
  source          text,                    -- e.g. "Navisworks 2026 · Week 28 run"
  run_at          timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE INDEX ix_clash_set_project ON bim.clash_set (project_id) WHERE deleted_at IS NULL;

CREATE TABLE bim.clash_item (
  id             uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id uuid NOT NULL REFERENCES core.organization(id),
  clash_set_id   uuid NOT NULL REFERENCES bim.clash_set(id),
  code           citext NOT NULL,
  grid_location  text,
  level_label    text,                     -- "Level 5–8"
  severity_code  text NOT NULL DEFAULT 'MEDIUM' REFERENCES core.priority(code),
  status         text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','ASSIGNED','RESOLVED')),
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_clash_item_code ON bim.clash_item (clash_set_id, code) WHERE deleted_at IS NULL;

CREATE TABLE bim.rfi (
  id                   uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id      uuid NOT NULL REFERENCES core.organization(id),
  code                 citext NOT NULL,                    -- RFI-014
  project_id           uuid NOT NULL REFERENCES proj.project(id),
  title                text NOT NULL,
  question             text,
  priority_code        text NOT NULL DEFAULT 'MEDIUM' REFERENCES core.priority(code),
  status_code          text NOT NULL DEFAULT 'PENDING' REFERENCES bim.rfi_status(code),
  raised_by_party_id   uuid NOT NULL REFERENCES party.party(id),
  directed_to_party_id uuid REFERENCES party.party(id),    -- client RFIs point here
  assignee_person_id   uuid REFERENCES party.person(party_id),
  raised_on            date NOT NULL DEFAULT current_date,
  response_due_on      date,                               -- SLA clock (business days via work_calendar)
  closed_at            timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_rfi_code ON bim.rfi (organization_id, code) WHERE deleted_at IS NULL;
CREATE INDEX ix_rfi_project_status ON bim.rfi (project_id, status_code) WHERE deleted_at IS NULL;
CREATE INDEX ix_rfi_sla ON bim.rfi (response_due_on) WHERE deleted_at IS NULL AND status_code IN ('PENDING','IN_PROGRESS');
CREATE INDEX ix_rfi_assignee ON bim.rfi (assignee_person_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_rfi_directed_to ON bim.rfi (directed_to_party_id) WHERE deleted_at IS NULL;

CREATE TABLE bim.rfi_response (
  id              uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id uuid NOT NULL REFERENCES core.organization(id),
  rfi_id          uuid NOT NULL REFERENCES bim.rfi(id),
  author_party_id uuid NOT NULL REFERENCES party.party(id),
  body            text NOT NULL,
  responded_at    timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE INDEX ix_rfi_response_rfi ON bim.rfi_response (rfi_id, responded_at) WHERE deleted_at IS NULL;

CREATE TABLE bim.issue (
  id                    uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id       uuid NOT NULL REFERENCES core.organization(id),
  code                  citext NOT NULL,                   -- ISS-008
  project_id            uuid NOT NULL REFERENCES proj.project(id),
  title                 text NOT NULL,
  description           text NOT NULL,
  severity_code         text NOT NULL DEFAULT 'MEDIUM' REFERENCES core.priority(code),
  status_code           text NOT NULL DEFAULT 'PENDING' REFERENCES bim.issue_status(code),
  category              text NOT NULL DEFAULT 'GENERAL'
                        CHECK (category IN ('CLASH','DELAY','COMPLIANCE','APPROVAL','GENERAL')),
  raised_by_party_id    uuid NOT NULL REFERENCES party.party(id),
  routed_to_party_id    uuid REFERENCES party.party(id),   -- RaiseIssueModal "send to"
  clash_item_id         uuid REFERENCES bim.clash_item(id),
  escalated_to_issue_id uuid REFERENCES bim.issue(id),     -- lineage, not a title prefix
  raised_on             date NOT NULL DEFAULT current_date,
  resolved_at           timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_issue_code ON bim.issue (organization_id, code) WHERE deleted_at IS NULL;
CREATE INDEX ix_issue_project_status ON bim.issue (project_id, status_code) WHERE deleted_at IS NULL;
CREATE INDEX ix_issue_routed_to ON bim.issue (routed_to_party_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_issue_raised_by ON bim.issue (raised_by_party_id) WHERE deleted_at IS NULL;

-- Append-only lifecycle trail (replaces the frontend's issue_flags store).
CREATE TABLE bim.issue_event (
  id               uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id  uuid NOT NULL REFERENCES core.organization(id),
  issue_id         uuid NOT NULL REFERENCES bim.issue(id),
  event_code       text NOT NULL
                   CHECK (event_code IN ('CREATED','ROUTED','RESPONDED','ESCALATED','RESOLVED','REOPENED','CLOSED')),
  actor_party_id   uuid REFERENCES party.party(id),
  body             text,                                   -- response text / escalation note
  related_issue_id uuid REFERENCES bim.issue(id),          -- ESCALATED → spawned issue
  occurred_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_issue_event ON bim.issue_event (issue_id, occurred_at);

-- Model registry (federated + discipline models; "Rev B" etc.).
CREATE TABLE bim.bim_model (
  id              uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id uuid NOT NULL REFERENCES core.organization(id),
  project_id      uuid NOT NULL REFERENCES proj.project(id),
  name            text NOT NULL,
  kind            text NOT NULL DEFAULT 'DISCIPLINE' CHECK (kind IN ('DISCIPLINE','FEDERATED')),
  discipline_id   uuid REFERENCES core.lookup_value(id),
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE INDEX ix_bim_model_project ON bim.bim_model (project_id) WHERE deleted_at IS NULL;

CREATE TABLE bim.model_version (
  id                  uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id     uuid NOT NULL REFERENCES core.organization(id),
  model_id            uuid NOT NULL REFERENCES bim.bim_model(id),
  version_label       text NOT NULL,                       -- "Rev B"
  document_version_id uuid,                                -- FK added in 0012
  published_by        uuid,
  published_at        timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_model_version ON bim.model_version (model_id, version_label) WHERE deleted_at IS NULL;

COMMIT;
