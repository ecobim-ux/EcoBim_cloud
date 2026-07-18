-- ═══════════════════════════════════════════════════════════════════════════
-- EcoBIM ERP · 0011 · wf: workflow engine, approvals, reminders
-- The frontend's 4-stage client-approval pipeline is instance #1 of a
-- table-driven process. The next approval type (PO, leave, doc review) is
-- a new workflow_definition row, not a code change.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

CREATE TABLE wf.workflow_definition (
  id              uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id uuid REFERENCES core.organization(id),   -- NULL = system definition
  code            text NOT NULL,
  name            text NOT NULL,
  subject_type    text NOT NULL
                  CHECK (subject_type IN ('MILESTONE','DELIVERABLE','DOCUMENT','LEAVE','GENERIC')),
  is_active       boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_workflow_definition_global ON wf.workflow_definition (code) WHERE organization_id IS NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX ux_workflow_definition_org ON wf.workflow_definition (organization_id, code) WHERE organization_id IS NOT NULL AND deleted_at IS NULL;

CREATE TABLE wf.workflow_stage (
  id            uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  definition_id uuid NOT NULL REFERENCES wf.workflow_definition(id),
  code          text NOT NULL,
  label         text NOT NULL,
  sort_order    integer NOT NULL,
  owner_role_id uuid REFERENCES iam.role(id),   -- who acts at this stage
  is_initial    boolean NOT NULL DEFAULT false,
  is_terminal   boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_workflow_stage ON wf.workflow_stage (definition_id, code) WHERE deleted_at IS NULL;

-- One row per running approval (frontend Approval a1/a2/a3).
CREATE TABLE wf.workflow_instance (
  id                uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id   uuid NOT NULL REFERENCES core.organization(id),
  code              citext NOT NULL,                        -- APR-00001
  definition_id     uuid NOT NULL REFERENCES wf.workflow_definition(id),
  current_stage_id  uuid NOT NULL REFERENCES wf.workflow_stage(id),
  title             text NOT NULL,                          -- "CD Model Submission"
  project_id        uuid REFERENCES proj.project(id),
  milestone_id      uuid REFERENCES proj.milestone(id),
  deliverable_id    uuid REFERENCES proj.deliverable(id),
  client_account_id uuid REFERENCES crm.client_account(id),
  opened_by         uuid,
  opened_at         timestamptz NOT NULL DEFAULT now(),
  closed_at         timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_workflow_instance_code ON wf.workflow_instance (organization_id, code) WHERE deleted_at IS NULL;
CREATE INDEX ix_workflow_instance_stage ON wf.workflow_instance (organization_id, current_stage_id) WHERE deleted_at IS NULL AND closed_at IS NULL;
CREATE INDEX ix_workflow_instance_project ON wf.workflow_instance (project_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_workflow_instance_client ON wf.workflow_instance (client_account_id) WHERE deleted_at IS NULL;

-- Append-only transition history — the frontend's history[] array, plus
-- typed notes (leadNote/adminNote become note_kind-tagged actions).
CREATE TABLE wf.workflow_action (
  id             uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id uuid NOT NULL REFERENCES core.organization(id),
  instance_id    uuid NOT NULL REFERENCES wf.workflow_instance(id),
  from_stage_id  uuid REFERENCES wf.workflow_stage(id),
  to_stage_id    uuid NOT NULL REFERENCES wf.workflow_stage(id),
  action_code    text NOT NULL,             -- REQUEST_REVIEW / SUGGEST_UPDATES / SEND_TO_CLIENT / APPROVE / REQUEST_REVISION / REMIND
  actor_party_id uuid REFERENCES party.party(id),
  note           text,
  occurred_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_workflow_action ON wf.workflow_action (instance_id, occurred_at);

-- Generic scheduled nudges (approval reminders, task reminders).
CREATE TABLE wf.reminder (
  id                   uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id      uuid NOT NULL REFERENCES core.organization(id),
  workflow_instance_id uuid REFERENCES wf.workflow_instance(id),
  task_id              uuid REFERENCES work.task(id),
  remind_at            timestamptz NOT NULL,
  channel              text NOT NULL DEFAULT 'PORTAL' CHECK (channel IN ('PORTAL','EMAIL')),
  note                 text,
  sent_at              timestamptz,
  CHECK (num_nonnulls(workflow_instance_id, task_id) = 1),
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE INDEX ix_reminder_due ON wf.reminder (remind_at) WHERE sent_at IS NULL AND deleted_at IS NULL;

COMMIT;
