-- ═══════════════════════════════════════════════════════════════════════════
-- EcoBIM ERP · 0007 · proj: projects, phases, LOD rules, members, milestones
-- Progress and issue counts are NEVER stored on project — they are derived
-- (see 0015 views). project_phase.percent_complete is the one operational
-- input (PM-maintained, few rows/project); v_phase_task_progress exposes the
-- task-derived figure alongside for drift monitoring.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

CREATE TABLE proj.project_status (
  code       text PRIMARY KEY,
  label      text NOT NULL,
  sort_order integer NOT NULL,
  color      text
);

CREATE TABLE proj.project (
  id                uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id   uuid NOT NULL REFERENCES core.organization(id),
  code              citext NOT NULL,                     -- PRJ-0001
  name              text NOT NULL,
  description       text,
  client_account_id uuid REFERENCES crm.client_account(id),
  project_type_id   uuid REFERENCES core.lookup_value(id),
  status_code       text NOT NULL DEFAULT 'ACTIVE' REFERENCES proj.project_status(code),
  lead_employee_id  uuid REFERENCES hr.employee(id),
  planned_start     date,
  planned_end       date,
  actual_start      date,
  actual_end        date,
  baseline_start    date,
  baseline_end      date,
  CHECK (planned_start IS NULL OR planned_end IS NULL OR planned_end >= planned_start),
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_project_code ON proj.project (organization_id, code) WHERE deleted_at IS NULL;
CREATE INDEX ix_project_client ON proj.project (client_account_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_project_lead ON proj.project (lead_employee_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_project_status ON proj.project (organization_id, status_code) WHERE deleted_at IS NULL;
CREATE INDEX ix_project_name_trgm ON proj.project USING gin (name gin_trgm_ops);

-- Deferred FK from 0006 (crm.lead → converted project).
ALTER TABLE crm.lead
  ADD CONSTRAINT fk_lead_converted_project
  FOREIGN KEY (converted_project_id) REFERENCES proj.project(id);

-- Phase instances per project (Concept…Construction), with schedule weights
-- (the Gantt segment widths) and gate state.
CREATE TABLE proj.project_phase (
  id                uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id   uuid NOT NULL REFERENCES core.organization(id),
  project_id        uuid NOT NULL REFERENCES proj.project(id),
  phase_id          uuid NOT NULL REFERENCES core.lookup_value(id),  -- type PROJECT_PHASE
  weight_pct        numeric(5,2) NOT NULL DEFAULT 0 CHECK (weight_pct >= 0 AND weight_pct <= 100),
  percent_complete  numeric(5,2) NOT NULL DEFAULT 0 CHECK (percent_complete >= 0 AND percent_complete <= 100),
  gate_status       text NOT NULL DEFAULT 'UPCOMING' CHECK (gate_status IN ('UPCOMING','ACTIVE','DONE')),
  planned_start     date,
  planned_end       date,
  actual_start      date,
  actual_end        date,
  CHECK (planned_start IS NULL OR planned_end IS NULL OR planned_end >= planned_start),
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_project_phase ON proj.project_phase (project_id, phase_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_project_phase_project ON proj.project_phase (project_id) WHERE deleted_at IS NULL;

-- BEP compliance rules: required LOD per phase per discipline
-- (source of truth for issues like "curtain wall must be LOD 400 in CD").
CREATE TABLE proj.lod_requirement (
  id               uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id  uuid NOT NULL REFERENCES core.organization(id),
  project_phase_id uuid NOT NULL REFERENCES proj.project_phase(id),
  discipline_id    uuid NOT NULL REFERENCES core.lookup_value(id),  -- type DISCIPLINE
  lod_id           uuid NOT NULL REFERENCES core.lookup_value(id),  -- type LOD
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_lod_requirement ON proj.lod_requirement (project_phase_id, discipline_id) WHERE deleted_at IS NULL;

-- Project staffing (team size on cards = count of active members).
CREATE TABLE proj.project_member (
  id               uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id  uuid NOT NULL REFERENCES core.organization(id),
  project_id       uuid NOT NULL REFERENCES proj.project(id),
  person_id        uuid NOT NULL REFERENCES party.person(party_id),
  project_role     text,                                  -- role on this project
  allocation_pct   numeric(5,2) CHECK (allocation_pct > 0 AND allocation_pct <= 100),
  active_from      date NOT NULL DEFAULT current_date,
  active_to        date,
  CHECK (active_to IS NULL OR active_to >= active_from),
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_project_member ON proj.project_member (project_id, person_id, active_from) WHERE deleted_at IS NULL;
CREATE INDEX ix_project_member_person ON proj.project_member (person_id) WHERE deleted_at IS NULL;

CREATE TABLE proj.milestone (
  id               uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id  uuid NOT NULL REFERENCES core.organization(id),
  project_id       uuid NOT NULL REFERENCES proj.project(id),
  project_phase_id uuid REFERENCES proj.project_phase(id),
  label            text NOT NULL,
  due_on           date,
  status           text NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING','ACTIVE','DONE')),
  client_visible   boolean NOT NULL DEFAULT true,
  completed_on     date,
  CHECK ((status = 'DONE') = (completed_on IS NOT NULL)),
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE INDEX ix_milestone_project ON proj.milestone (project_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_milestone_due ON proj.milestone (due_on) WHERE deleted_at IS NULL AND status <> 'DONE';

-- Named outputs (CD Set, federated model) — approval subjects and doc anchors.
CREATE TABLE proj.deliverable (
  id                  uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id     uuid NOT NULL REFERENCES core.organization(id),
  project_id          uuid NOT NULL REFERENCES proj.project(id),
  milestone_id        uuid REFERENCES proj.milestone(id),
  name                text NOT NULL,
  deliverable_type_id uuid REFERENCES core.lookup_value(id),  -- type DELIVERABLE_TYPE
  description         text,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE INDEX ix_deliverable_project ON proj.deliverable (project_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_deliverable_milestone ON proj.deliverable (milestone_id) WHERE deleted_at IS NULL;

-- Periodic computed health rows → trend reports without historical recompute.
CREATE TABLE proj.project_snapshot (
  id            uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id uuid NOT NULL REFERENCES core.organization(id),
  project_id    uuid NOT NULL REFERENCES proj.project(id),
  as_of         date NOT NULL,
  progress_pct  numeric(5,2),
  open_issues   integer,
  open_rfis     integer,
  logged_hours  numeric(10,2),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ux_project_snapshot ON proj.project_snapshot (project_id, as_of);

COMMIT;
