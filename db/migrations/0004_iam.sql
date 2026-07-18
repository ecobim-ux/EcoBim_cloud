-- ═══════════════════════════════════════════════════════════════════════════
-- EcoBIM ERP · 0004 · iam: identity, RBAC, sessions, interaction policies
-- Replaces the frontend's three plaintext credential stores with one
-- identity substrate. Passwords: argon2id hashed in the app layer; the DB
-- only ever stores hashes (dev seeds use bcrypt via pgcrypto).
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

CREATE TABLE iam.user_account (
  id               uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id  uuid NOT NULL REFERENCES core.organization(id),
  party_id         uuid NOT NULL REFERENCES party.party(id),
  login_id         citext NOT NULL,
  status           text NOT NULL DEFAULT 'INVITED'
                   CHECK (status IN ('INVITED','ACTIVE','LOCKED','DISABLED')),
  last_login_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_user_account_login ON iam.user_account (organization_id, login_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX ux_user_account_party ON iam.user_account (party_id) WHERE deleted_at IS NULL;

CREATE TABLE iam.credential (
  id               uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id  uuid NOT NULL REFERENCES core.organization(id),
  user_account_id  uuid NOT NULL REFERENCES iam.user_account(id),
  kind             text NOT NULL DEFAULT 'PASSWORD'
                   CHECK (kind IN ('PASSWORD','TOTP','WEBAUTHN','SSO')),
  secret_hash      text,                 -- NULL for SSO subjects
  algo             text NOT NULL DEFAULT 'argon2id',
  is_active        boolean NOT NULL DEFAULT true,
  rotated_at       timestamptz,
  expires_at       timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_credential_active
  ON iam.credential (user_account_id, kind) WHERE is_active AND deleted_at IS NULL;

CREATE TABLE iam.auth_session (
  id               uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id  uuid NOT NULL REFERENCES core.organization(id),
  user_account_id  uuid NOT NULL REFERENCES iam.user_account(id),
  token_hash       text NOT NULL,        -- hash of the session/refresh token
  ip               inet,
  user_agent       text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  last_seen_at     timestamptz NOT NULL DEFAULT now(),
  expires_at       timestamptz NOT NULL,
  revoked_at       timestamptz
);
CREATE UNIQUE INDEX ux_auth_session_token ON iam.auth_session (token_hash);
CREATE INDEX ix_auth_session_user ON iam.auth_session (user_account_id, expires_at DESC);

CREATE TABLE iam.password_reset (
  id               uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id  uuid NOT NULL REFERENCES core.organization(id),
  user_account_id  uuid NOT NULL REFERENCES iam.user_account(id),
  token_hash       text NOT NULL,
  expires_at       timestamptz NOT NULL,
  used_at          timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ux_password_reset_token ON iam.password_reset (token_hash);

-- ─── RBAC ──────────────────────────────────────────────────────────────────
-- organization_id NULL = system role shipped with the platform.
CREATE TABLE iam.role (
  id               uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id  uuid REFERENCES core.organization(id),
  code             text NOT NULL,
  name             text NOT NULL,
  is_system        boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_role_system ON iam.role (code) WHERE organization_id IS NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX ux_role_org ON iam.role (organization_id, code) WHERE organization_id IS NOT NULL AND deleted_at IS NULL;

-- Static permission catalog (maintained by migrations, not at runtime).
CREATE TABLE iam.permission (
  code        text PRIMARY KEY,
  module      text NOT NULL,
  description text NOT NULL
);

CREATE TABLE iam.role_permission (
  role_id         uuid NOT NULL REFERENCES iam.role(id),
  permission_code text NOT NULL REFERENCES iam.permission(code),
  PRIMARY KEY (role_id, permission_code)
);

CREATE TABLE iam.user_role (
  user_account_id uuid NOT NULL REFERENCES iam.user_account(id),
  role_id         uuid NOT NULL REFERENCES iam.role(id),
  granted_by      uuid,
  granted_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_account_id, role_id)
);
CREATE INDEX ix_user_role_role ON iam.user_role (role_id);

-- Resource-scoped access (client → their projects/documents, per-project grants).
CREATE TABLE iam.resource_grant (
  id               uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id  uuid NOT NULL REFERENCES core.organization(id),
  user_account_id  uuid NOT NULL REFERENCES iam.user_account(id),
  resource_type    text NOT NULL CHECK (resource_type IN ('PROJECT','DOCUMENT','CLIENT_ACCOUNT')),
  resource_id      uuid NOT NULL,
  capability       text NOT NULL CHECK (capability IN ('VIEW','EDIT','APPROVE','ADMIN')),
  granted_by       uuid,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_resource_grant
  ON iam.resource_grant (user_account_id, resource_type, resource_id, capability) WHERE deleted_at IS NULL;
CREATE INDEX ix_resource_grant_resource ON iam.resource_grant (resource_type, resource_id) WHERE deleted_at IS NULL;

-- Generalization of the frontend's "reach-out rules" matrix:
-- which role may initiate which interaction with which role.
CREATE TABLE iam.interaction_policy (
  id               uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id  uuid NOT NULL REFERENCES core.organization(id),
  from_role_id     uuid NOT NULL REFERENCES iam.role(id),
  to_role_id       uuid NOT NULL REFERENCES iam.role(id),
  interaction_code text NOT NULL CHECK (interaction_code IN ('MEETING_INVITE','ISSUE_ROUTE','MESSAGE')),
  allowed          boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_interaction_policy
  ON iam.interaction_policy (organization_id, from_role_id, to_role_id, interaction_code) WHERE deleted_at IS NULL;

-- Append-only login trail.
CREATE TABLE iam.login_audit (
  id               uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id  uuid REFERENCES core.organization(id),
  login_id         citext,
  user_account_id  uuid REFERENCES iam.user_account(id),
  success          boolean NOT NULL,
  failure_reason   text,
  ip               inet,
  user_agent       text,
  occurred_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_login_audit_user ON iam.login_audit (user_account_id, occurred_at DESC);
CREATE INDEX ix_login_audit_time ON iam.login_audit (occurred_at DESC);

COMMIT;
