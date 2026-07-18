-- ═══════════════════════════════════════════════════════════════════════════
-- EcoBIM ERP · 0013 · comms: notifications, meetings, messages, comments,
-- email outbox
-- Notifications are USER-addressed via per-recipient delivery rows — fixing
-- the frontend's role-broadcast privacy bug. Unread badges are
-- `WHERE read_at IS NULL` against a partial index, never a table scan.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

-- Event payload (immutable once written).
CREATE TABLE comms.notification (
  id              uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id uuid NOT NULL REFERENCES core.organization(id),
  event_code      text NOT NULL,             -- TASK_ASSIGNED / ISSUE_RAISED / APPROVAL_REQUESTED / …
  title           text NOT NULL,
  body            text NOT NULL,
  target_kind     text,                      -- deep-link target type ("TASK","ISSUE",…)
  target_id       uuid,
  deep_link       text,                      -- portal route hint (the frontend's `tab`)
  created_by      uuid,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_notification_org_time ON comms.notification (organization_id, created_at DESC);

-- Per-recipient delivery state. Partitioned monthly: millions of rows,
-- and old read rows age out via partition detach.
CREATE TABLE comms.notification_delivery (
  id              uuid NOT NULL DEFAULT core.uuid_v7(),
  organization_id uuid NOT NULL REFERENCES core.organization(id),
  notification_id uuid NOT NULL REFERENCES comms.notification(id),
  user_account_id uuid NOT NULL REFERENCES iam.user_account(id),
  channel         text NOT NULL DEFAULT 'PORTAL' CHECK (channel IN ('PORTAL','EMAIL')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  read_at         timestamptz,
  dismissed_at    timestamptz,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  updated_by      uuid,
  row_version     integer NOT NULL DEFAULT 1,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE comms.notification_delivery_default PARTITION OF comms.notification_delivery DEFAULT;

CREATE INDEX ix_notif_delivery_user ON comms.notification_delivery (user_account_id, created_at DESC);
CREATE INDEX ix_notif_delivery_unread ON comms.notification_delivery (user_account_id) WHERE read_at IS NULL AND dismissed_at IS NULL;
CREATE INDEX ix_notif_delivery_notification ON comms.notification_delivery (notification_id);

CREATE TABLE comms.meeting (
  id                 uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id    uuid NOT NULL REFERENCES core.organization(id),
  code               citext NOT NULL,                     -- MTG-000001
  title              text NOT NULL,
  starts_at          timestamptz NOT NULL,
  duration_minutes   integer NOT NULL DEFAULT 30 CHECK (duration_minutes BETWEEN 5 AND 480),
  provider           text NOT NULL DEFAULT 'GOOGLE_MEET'
                     CHECK (provider IN ('GOOGLE_MEET','TEAMS','ZOOM','OTHER')),
  join_url           text,
  organizer_party_id uuid NOT NULL REFERENCES party.party(id),
  project_id         uuid REFERENCES proj.project(id),
  task_id            uuid REFERENCES work.task(id),
  client_account_id  uuid REFERENCES crm.client_account(id),
  note               text,
  cancelled_at       timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_meeting_code ON comms.meeting (organization_id, code) WHERE deleted_at IS NULL;
CREATE INDEX ix_meeting_organizer ON comms.meeting (organizer_party_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_meeting_starts ON comms.meeting (organization_id, starts_at) WHERE deleted_at IS NULL AND cancelled_at IS NULL;
CREATE INDEX ix_meeting_project ON comms.meeting (project_id) WHERE deleted_at IS NULL;

CREATE TABLE comms.meeting_attendee (
  id         uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id uuid NOT NULL REFERENCES core.organization(id),
  meeting_id uuid NOT NULL REFERENCES comms.meeting(id),
  party_id   uuid NOT NULL REFERENCES party.party(id),
  response   text NOT NULL DEFAULT 'INVITED'
             CHECK (response IN ('INVITED','ACCEPTED','DECLINED','TENTATIVE')),
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_meeting_attendee ON comms.meeting_attendee (meeting_id, party_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_meeting_attendee_party ON comms.meeting_attendee (party_id) WHERE deleted_at IS NULL;

-- Direct messages (the employee→lead "ping" with subject/description).
CREATE TABLE comms.message (
  id                 uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id    uuid NOT NULL REFERENCES core.organization(id),
  sender_party_id    uuid NOT NULL REFERENCES party.party(id),
  recipient_party_id uuid NOT NULL REFERENCES party.party(id),
  subject            text NOT NULL,
  body               text NOT NULL,
  sent_at            timestamptz NOT NULL DEFAULT now(),
  read_at            timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE INDEX ix_message_recipient ON comms.message (recipient_party_id, sent_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX ix_message_unread ON comms.message (recipient_party_id) WHERE read_at IS NULL AND deleted_at IS NULL;

-- Generic threaded comments on work/coordination objects.
CREATE TABLE comms.comment (
  id              uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id uuid NOT NULL REFERENCES core.organization(id),
  author_party_id uuid NOT NULL REFERENCES party.party(id),
  body            text NOT NULL,
  task_id         uuid REFERENCES work.task(id),
  issue_id        uuid REFERENCES bim.issue(id),
  rfi_id          uuid REFERENCES bim.rfi(id),
  CHECK (num_nonnulls(task_id, issue_id, rfi_id) = 1),
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE INDEX ix_comment_task ON comms.comment (task_id, created_at) WHERE deleted_at IS NULL;
CREATE INDEX ix_comment_issue ON comms.comment (issue_id, created_at) WHERE deleted_at IS NULL;
CREATE INDEX ix_comment_rfi ON comms.comment (rfi_id, created_at) WHERE deleted_at IS NULL;

-- Transactional-outbox email queue (replaces every mailto: link).
-- Partitioned monthly; sent rows age out with their partition.
CREATE TABLE comms.email_outbox (
  id              uuid NOT NULL DEFAULT core.uuid_v7(),
  organization_id uuid NOT NULL REFERENCES core.organization(id),
  template_code   text NOT NULL,             -- LEAD_FIRST_CONTACT / TASK_ASSIGNED / APPROVAL_REMINDER / …
  to_email        citext NOT NULL,
  subject         text NOT NULL,
  params          jsonb NOT NULL DEFAULT '{}'::jsonb,
  status          text NOT NULL DEFAULT 'QUEUED'
                  CHECK (status IN ('QUEUED','SENDING','SENT','FAILED')),
  attempts        integer NOT NULL DEFAULT 0,
  last_error      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  sent_at         timestamptz,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  updated_by      uuid,
  row_version     integer NOT NULL DEFAULT 1,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE comms.email_outbox_default PARTITION OF comms.email_outbox DEFAULT;

CREATE INDEX ix_email_outbox_queued ON comms.email_outbox (created_at) WHERE status = 'QUEUED';

COMMIT;
