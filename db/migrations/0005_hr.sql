-- ═══════════════════════════════════════════════════════════════════════════
-- EcoBIM ERP · 0005 · hr: employment, teams, capacity, calendars
-- The employee/person split is the socket for future HRMS/Payroll.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

CREATE TABLE hr.job_position (
  id               uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id  uuid NOT NULL REFERENCES core.organization(id),
  code             citext NOT NULL,
  title            text NOT NULL,          -- "Senior BIM Lead", "BIM Coordinator"
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_job_position_code ON hr.job_position (organization_id, code) WHERE deleted_at IS NULL;

CREATE TABLE hr.employee (
  id               uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id  uuid NOT NULL REFERENCES core.organization(id),
  person_id        uuid NOT NULL REFERENCES party.person(party_id),
  employee_no      citext NOT NULL,
  job_position_id  uuid REFERENCES hr.job_position(id),
  department_id    uuid REFERENCES core.department(id),
  branch_id        uuid REFERENCES core.branch(id),
  manager_id       uuid REFERENCES hr.employee(id),    -- org chart / lead chain
  hired_on         date,
  terminated_on    date,
  status           text NOT NULL DEFAULT 'ACTIVE'
                   CHECK (status IN ('ACTIVE','ON_LEAVE','TERMINATED')),
  CHECK (terminated_on IS NULL OR hired_on IS NULL OR terminated_on >= hired_on),
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_employee_no ON hr.employee (organization_id, employee_no) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX ux_employee_person ON hr.employee (person_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_employee_manager ON hr.employee (manager_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_employee_department ON hr.employee (department_id) WHERE deleted_at IS NULL;

-- Weekly hour targets with effective dating (the frontend's 40h/36h/… targets).
CREATE TABLE hr.capacity_target (
  id             uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id uuid NOT NULL REFERENCES core.organization(id),
  employee_id    uuid NOT NULL REFERENCES hr.employee(id),
  weekly_hours   numeric(5,2) NOT NULL CHECK (weekly_hours > 0 AND weekly_hours <= 100),
  effective_from date NOT NULL,
  effective_to   date,
  CHECK (effective_to IS NULL OR effective_to >= effective_from),
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_capacity_target ON hr.capacity_target (employee_id, effective_from) WHERE deleted_at IS NULL;

-- Working calendars (UAE week, public holidays) — feeds productivity math
-- and business-day SLA computation for RFIs.
CREATE TABLE hr.work_calendar (
  id               uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id  uuid NOT NULL REFERENCES core.organization(id),
  code             citext NOT NULL,
  name             text NOT NULL,
  workdays         smallint[] NOT NULL DEFAULT '{1,2,3,4,5}',  -- ISO dow, Mon=1
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_work_calendar_code ON hr.work_calendar (organization_id, code) WHERE deleted_at IS NULL;

CREATE TABLE hr.calendar_holiday (
  id           uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id uuid NOT NULL REFERENCES core.organization(id),
  calendar_id  uuid NOT NULL REFERENCES hr.work_calendar(id),
  holiday_date date NOT NULL,
  label        text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_calendar_holiday ON hr.calendar_holiday (calendar_id, holiday_date) WHERE deleted_at IS NULL;

-- Teams (the lead's "My Team"). Staffing concern → hr, not core.
CREATE TABLE hr.team (
  id               uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id  uuid NOT NULL REFERENCES core.organization(id),
  department_id    uuid REFERENCES core.department(id),
  code             citext NOT NULL,
  name             text NOT NULL,
  lead_employee_id uuid REFERENCES hr.employee(id),
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_team_code ON hr.team (organization_id, code) WHERE deleted_at IS NULL;
CREATE INDEX ix_team_lead ON hr.team (lead_employee_id) WHERE deleted_at IS NULL;

CREATE TABLE hr.team_member (
  id           uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id uuid NOT NULL REFERENCES core.organization(id),
  team_id      uuid NOT NULL REFERENCES hr.team(id),
  employee_id  uuid NOT NULL REFERENCES hr.employee(id),
  role_label   text,
  joined_on    date NOT NULL DEFAULT current_date,
  left_on      date,
  CHECK (left_on IS NULL OR left_on >= joined_on),
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_team_member ON hr.team_member (team_id, employee_id, joined_on) WHERE deleted_at IS NULL;
CREATE INDEX ix_team_member_employee ON hr.team_member (employee_id) WHERE deleted_at IS NULL;

COMMIT;
