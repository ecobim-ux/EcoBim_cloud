-- ═══════════════════════════════════════════════════════════════════════════
-- EcoBIM ERP · 0003 · party: unified party model
-- Employees, clients, consultants, vendors, candidates are all parties.
-- This is the substrate that lets HRMS / CRM / Procurement attach later.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

CREATE TABLE party.party (
  id               uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id  uuid NOT NULL REFERENCES core.organization(id),
  kind             text NOT NULL CHECK (kind IN ('PERSON','ORG')),
  display_name     text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE INDEX ix_party_org ON party.party (organization_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_party_display_trgm ON party.party USING gin (display_name gin_trgm_ops);

-- Subtype: natural person (PK = party id → 1:0..1)
CREATE TABLE party.person (
  party_id    uuid PRIMARY KEY REFERENCES party.party(id),
  first_name  text NOT NULL,
  last_name   text,
  initials    text,               -- display initials ("AM"); derivable, cached
  locale      text NOT NULL DEFAULT 'en',
  avatar_url  text,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);

-- Subtype: organization-party (client companies, consultants, vendors)
CREATE TABLE party.party_org (
  party_id      uuid PRIMARY KEY REFERENCES party.party(id),
  legal_name    text,
  industry      text,
  trade_license text,
  website       text,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);

CREATE TABLE party.contact_point (
  id          uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id uuid NOT NULL REFERENCES core.organization(id),
  party_id    uuid NOT NULL REFERENCES party.party(id),
  kind        text NOT NULL CHECK (kind IN ('EMAIL','PHONE')),
  value       citext NOT NULL,
  is_primary  boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE INDEX ix_contact_point_party ON party.contact_point (party_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_contact_point_value ON party.contact_point (value) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX ux_contact_point_primary
  ON party.contact_point (party_id, kind) WHERE is_primary AND deleted_at IS NULL;

CREATE TABLE party.address (
  id          uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id uuid NOT NULL REFERENCES core.organization(id),
  party_id    uuid NOT NULL REFERENCES party.party(id),
  kind        text NOT NULL DEFAULT 'BUSINESS' CHECK (kind IN ('BUSINESS','BILLING','SHIPPING','HOME')),
  line1       text NOT NULL,
  line2       text,
  city        text,
  region      text,
  country     char(2) NOT NULL DEFAULT 'AE',
  postal_code text,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE INDEX ix_address_party ON party.address (party_id) WHERE deleted_at IS NULL;

-- Role-in-business, date-bounded. A person can hold several concurrently.
CREATE TABLE party.party_role (
  id          uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id uuid NOT NULL REFERENCES core.organization(id),
  party_id    uuid NOT NULL REFERENCES party.party(id),
  role_code   text NOT NULL CHECK (role_code IN ('CLIENT','EMPLOYEE','CONSULTANT','VENDOR','CANDIDATE')),
  valid_from  date NOT NULL DEFAULT current_date,
  valid_to    date,
  CHECK (valid_to IS NULL OR valid_to >= valid_from),
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_party_role ON party.party_role (party_id, role_code, valid_from) WHERE deleted_at IS NULL;
CREATE INDEX ix_party_role_code ON party.party_role (organization_id, role_code) WHERE deleted_at IS NULL;

-- Typed party↔party links ("Khalid is CONTACT_OF Al Mansoori RE").
CREATE TABLE party.party_relationship (
  id            uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id uuid NOT NULL REFERENCES core.organization(id),
  from_party_id uuid NOT NULL REFERENCES party.party(id),
  to_party_id   uuid NOT NULL REFERENCES party.party(id),
  rel_code      text NOT NULL CHECK (rel_code IN ('CONTACT_OF','EMPLOYEE_OF','OWNER_OF','SUBSIDIARY_OF')),
  valid_from    date NOT NULL DEFAULT current_date,
  valid_to      date,
  CHECK (from_party_id <> to_party_id),
  CHECK (valid_to IS NULL OR valid_to >= valid_from),
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_party_relationship
  ON party.party_relationship (from_party_id, to_party_id, rel_code, valid_from) WHERE deleted_at IS NULL;
CREATE INDEX ix_party_relationship_to ON party.party_relationship (to_party_id) WHERE deleted_at IS NULL;

COMMIT;
