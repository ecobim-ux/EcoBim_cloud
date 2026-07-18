-- ═══════════════════════════════════════════════════════════════════════════
-- EcoBIM ERP · 0009 · timelog: time entries (partitioned), timesheets
-- The "log time before completing" rule is enforced in the service layer
-- (SUM(time_entry.hours) > 0 gate on task completion) — a cross-table rule
-- that does not belong in a CHECK constraint.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

-- Partitioned by work month. Partition key must be in the PK; nothing
-- references time_entry, so the composite PK costs nothing.
-- Ongoing partition creation: pg_partman (see db/README.md). A DEFAULT
-- partition guarantees inserts always land somewhere.
CREATE TABLE timelog.time_entry (
  id               uuid NOT NULL DEFAULT core.uuid_v7(),
  organization_id  uuid NOT NULL REFERENCES core.organization(id),
  employee_id      uuid NOT NULL REFERENCES hr.employee(id),
  task_id          uuid NOT NULL REFERENCES work.task(id),
  work_date        date NOT NULL,
  hours            numeric(5,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
  work_type_id     uuid REFERENCES core.lookup_value(id),   -- MODELING/COORDINATION/RFI/DOCUMENTATION
  note             text,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1,
  PRIMARY KEY (id, work_date)
) PARTITION BY RANGE (work_date);

CREATE TABLE timelog.time_entry_default PARTITION OF timelog.time_entry DEFAULT;

CREATE INDEX ix_time_entry_employee_date ON timelog.time_entry (employee_id, work_date);
CREATE INDEX ix_time_entry_task ON timelog.time_entry (task_id);
CREATE INDEX ix_time_entry_org_date ON timelog.time_entry (organization_id, work_date);

-- Weekly timesheet envelope per employee — the approval unit that Payroll
-- and billing will consume later.
CREATE TABLE timelog.timesheet (
  id            uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id uuid NOT NULL REFERENCES core.organization(id),
  employee_id   uuid NOT NULL REFERENCES hr.employee(id),
  period_start  date NOT NULL,
  period_end    date NOT NULL,
  status        text NOT NULL DEFAULT 'OPEN'
                CHECK (status IN ('OPEN','SUBMITTED','APPROVED','REJECTED')),
  submitted_at  timestamptz,
  approved_by   uuid,
  approved_at   timestamptz,
  CHECK (period_end >= period_start),
  CHECK ((status IN ('APPROVED')) = (approved_at IS NOT NULL)),
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_timesheet_period ON timelog.timesheet (employee_id, period_start) WHERE deleted_at IS NULL;
CREATE INDEX ix_timesheet_status ON timelog.timesheet (organization_id, status) WHERE deleted_at IS NULL;

COMMIT;
