-- ═══════════════════════════════════════════════════════════════════════════
-- EcoBIM ERP · 0006 · crm: leads (estimate requests), services, client accounts
-- Models the website-form → Admin triage → Lead delegation pipeline.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

CREATE TABLE crm.lead_status (
  code       text PRIMARY KEY,
  label      text NOT NULL,
  sort_order integer NOT NULL,
  color      text
);

CREATE TABLE crm.service_catalog (
  id               uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id  uuid REFERENCES core.organization(id),   -- NULL = global seed
  code             text NOT NULL,
  name             text NOT NULL,
  is_active        boolean NOT NULL DEFAULT true,
  sort_order       integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_service_catalog_global ON crm.service_catalog (code) WHERE organization_id IS NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX ux_service_catalog_org ON crm.service_catalog (organization_id, code) WHERE organization_id IS NOT NULL AND deleted_at IS NULL;

-- Client relationship record. party_org_id = the client company party;
-- primary_contact_party_id = the person party we talk to.
CREATE TABLE crm.client_account (
  id                       uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id          uuid NOT NULL REFERENCES core.organization(id),
  code                     citext NOT NULL,                    -- CLT-000001
  party_org_id             uuid NOT NULL REFERENCES party.party(id),
  primary_contact_party_id uuid REFERENCES party.party(id),
  owner_employee_id        uuid REFERENCES hr.employee(id),    -- dedicated team lead
  status                   text NOT NULL DEFAULT 'ACTIVE'
                           CHECK (status IN ('PROSPECT','ACTIVE','DORMANT','CLOSED')),
  onboarded_on             date,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_client_account_code ON crm.client_account (organization_id, code) WHERE deleted_at IS NULL;
CREATE INDEX ix_client_account_party ON crm.client_account (party_org_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_client_account_owner ON crm.client_account (owner_employee_id) WHERE deleted_at IS NULL;

-- Estimate request / lead. Contact fields are a snapshot of what the form
-- submitted; party_id is filled once matched/merged to a real party.
CREATE TABLE crm.lead (
  id                    uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id       uuid NOT NULL REFERENCES core.organization(id),
  code                  citext NOT NULL,                      -- REQ-09821
  source                text NOT NULL DEFAULT 'WEBSITE'
                        CHECK (source IN ('WEBSITE','MANUAL','REFERRAL','CAMPAIGN')),
  contact_name          text NOT NULL,
  company_name          text,
  contact_role          text,                                 -- "Developer / Owner", "GC", …
  email                 citext,
  phone                 text,
  project_scale         text,                                 -- "520k sq ft"
  brief                 text,
  status_code           text NOT NULL DEFAULT 'NEW' REFERENCES crm.lead_status(code),
  party_id              uuid REFERENCES party.party(id),
  converted_client_id   uuid REFERENCES crm.client_account(id),
  converted_project_id  uuid,                                 -- FK added in 0007
  first_response_due_at timestamptz,                          -- intake SLA
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_lead_code ON crm.lead (organization_id, code) WHERE deleted_at IS NULL;
CREATE INDEX ix_lead_status ON crm.lead (organization_id, status_code) WHERE deleted_at IS NULL;
CREATE INDEX ix_lead_email ON crm.lead (email) WHERE deleted_at IS NULL;
CREATE INDEX ix_lead_company_trgm ON crm.lead USING gin (company_name gin_trgm_ops);

CREATE TABLE crm.lead_service (
  lead_id    uuid NOT NULL REFERENCES crm.lead(id),
  service_id uuid NOT NULL REFERENCES crm.service_catalog(id),
  PRIMARY KEY (lead_id, service_id)
);

-- Delegation chain: Admin → team lead (LEAD_OWNER), lead → employee (DELEGATE).
CREATE TABLE crm.lead_assignment (
  id                    uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id       uuid NOT NULL REFERENCES core.organization(id),
  lead_id               uuid NOT NULL REFERENCES crm.lead(id),
  kind                  text NOT NULL CHECK (kind IN ('LEAD_OWNER','DELEGATE')),
  assigned_to_employee_id uuid NOT NULL REFERENCES hr.employee(id),
  assigned_by           uuid,
  note                  text,
  assigned_at           timestamptz NOT NULL DEFAULT now(),
  released_at           timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid,
  deleted_at timestamptz, row_version integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX ux_lead_assignment_current
  ON crm.lead_assignment (lead_id, kind) WHERE released_at IS NULL AND deleted_at IS NULL;
CREATE INDEX ix_lead_assignment_employee ON crm.lead_assignment (assigned_to_employee_id) WHERE deleted_at IS NULL;

-- Append-only pipeline trail → conversion metrics, intake SLA reporting.
CREATE TABLE crm.lead_status_history (
  id           uuid PRIMARY KEY DEFAULT core.uuid_v7(),
  organization_id uuid NOT NULL REFERENCES core.organization(id),
  lead_id      uuid NOT NULL REFERENCES crm.lead(id),
  from_status  text REFERENCES crm.lead_status(code),
  to_status    text NOT NULL REFERENCES crm.lead_status(code),
  changed_by   uuid,
  note         text,
  changed_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_lead_status_history ON crm.lead_status_history (lead_id, changed_at);

COMMIT;
