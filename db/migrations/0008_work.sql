-- ═══════════════════════════════════════════════════════════════════════════
-- EcoBIM ERP · 0008 · work: work packages, tasks, assignments, dependencies
-- task is the highest-volume operational table (millions of rows at target
-- scale) — indexing here mirrors the hot dashboard queries.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

CREATE TABLE work.task_status (
  code       text PRIMARY KEY,
  label      text NOT NULL,
  sort_order integer NOT NULL,
  color      text
);

-- Admin/lead breakdown container (frontend WorkItem, e.g. WI-1001).
-- Rollup status/pct is derived from child tasks — see 0015.
CREATE TABLE work.work_package (
  id               uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id  uuid NOT NULL REFERENCES core.organization(id),
  code             citext NOT NULL,                        -- WI-1001
  project_id       uuid NOT NULL REFERENCES proj.project(id),
  title            text NOT NULL,
  description      text,
  due_on           date,
  lead_employee_id uuid REFERENCES hr.employee(id),
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_work_package_code ON work.work_package (organization_id, code) WHERE deleted_at IS NULL;
CREATE INDEX ix_work_package_project ON work.work_package (project_id) WHERE deleted_at IS NULL;

CREATE TABLE work.task (
  id                  uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id     uuid NOT NULL REFERENCES core.organization(id),
  code                citext NOT NULL,                     -- TSK-000001
  project_id          uuid NOT NULL REFERENCES proj.project(id),
  work_package_id     uuid REFERENCES work.work_package(id),
  parent_task_id      uuid REFERENCES work.task(id),       -- subtasks
  milestone_id        uuid REFERENCES proj.milestone(id),
  project_phase_id    uuid REFERENCES proj.project_phase(id),
  title               text NOT NULL,
  description         text,
  deliverable_type_id uuid REFERENCES core.lookup_value(id),  -- MODEL/REPORT/DRAWINGS/RFI/TASK
  lod_id              uuid REFERENCES core.lookup_value(id),  -- type LOD
  priority_code       text NOT NULL DEFAULT 'MEDIUM' REFERENCES core.priority(code),
  status_code         text NOT NULL DEFAULT 'NOT_STARTED' REFERENCES work.task_status(code),
  estimated_hours     numeric(6,2) CHECK (estimated_hours IS NULL OR estimated_hours > 0),
  percent_complete    smallint NOT NULL DEFAULT 0 CHECK (percent_complete BETWEEN 0 AND 100),
  due_on              date,
  scheduled_on        date,          -- "today" planning flag, as a real date
  delay_reason        text,          -- the frontend's delay banner text
  completed_at        timestamptz,
  CHECK ((status_code = 'COMPLETED') = (completed_at IS NOT NULL)),
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_task_code ON work.task (organization_id, code) WHERE deleted_at IS NULL;
CREATE INDEX ix_task_project_status ON work.task (organization_id, project_id, status_code) WHERE deleted_at IS NULL;
CREATE INDEX ix_task_work_package ON work.task (work_package_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_task_parent ON work.task (parent_task_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_task_milestone ON work.task (milestone_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_task_due ON work.task (due_on) WHERE deleted_at IS NULL AND status_code <> 'COMPLETED';
CREATE INDEX ix_task_title_trgm ON work.task USING gin (title gin_trgm_ops);

-- Single current assignee (frontend model), with reassignment history kept.
CREATE TABLE work.task_assignment (
  id                    uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id       uuid NOT NULL REFERENCES core.organization(id),
  task_id               uuid NOT NULL REFERENCES work.task(id),
  assignee_person_id    uuid NOT NULL REFERENCES party.person(party_id),
  assigned_by_person_id uuid REFERENCES party.person(party_id),
  assigned_at           timestamptz NOT NULL DEFAULT now(),
  unassigned_at         timestamptz,
  is_current            boolean NOT NULL DEFAULT true,
  CHECK (NOT is_current OR unassigned_at IS NULL),
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_task_assignment_current
  ON work.task_assignment (task_id) WHERE is_current AND deleted_at IS NULL;
CREATE INDEX ix_task_assignment_assignee
  ON work.task_assignment (assignee_person_id) WHERE is_current AND deleted_at IS NULL;

-- Blocking links ("blocking model update and coordination milestone") —
-- feeds Delay Analysis / critical path.
CREATE TABLE work.task_dependency (
  id                  uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id     uuid NOT NULL REFERENCES core.organization(id),
  predecessor_task_id uuid NOT NULL REFERENCES work.task(id),
  successor_task_id   uuid NOT NULL REFERENCES work.task(id),
  dep_kind            text NOT NULL DEFAULT 'FS' CHECK (dep_kind IN ('FS','SS','FF','SF')),
  lag_days            integer NOT NULL DEFAULT 0,
  CHECK (predecessor_task_id <> successor_task_id),
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_task_dependency
  ON work.task_dependency (predecessor_task_id, successor_task_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_task_dependency_succ ON work.task_dependency (successor_task_id) WHERE deleted_at IS NULL;

-- Append-only status trail (actor + timestamp per change).
CREATE TABLE work.task_status_history (
  id          uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id uuid NOT NULL REFERENCES core.organization(id),
  task_id     uuid NOT NULL REFERENCES work.task(id),
  from_status text REFERENCES work.task_status(code),
  to_status   text NOT NULL REFERENCES work.task_status(code),
  changed_by  uuid,
  note        text,
  changed_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_task_status_history ON work.task_status_history (task_id, changed_at);

COMMIT;
