-- ═══════════════════════════════════════════════════════════════════════════
-- EcoBIM ERP · 0016 · Touch triggers, audit attachment, RLS, app role/grants
-- Order matters: this runs after every table exists.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

-- ─── 1 · Attach touch trigger to every table that has updated_at ──────────
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.oid::regclass AS tbl
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname IN ('core','party','iam','hr','crm','proj','work','timelog','bim','wf','dms','comms','audit','bi','ops')
      AND c.relkind IN ('r','p')
      AND EXISTS (SELECT 1 FROM pg_attribute a
                  WHERE a.attrelid = c.oid AND a.attname = 'updated_at' AND NOT a.attisdropped)
      AND EXISTS (SELECT 1 FROM pg_attribute a
                  WHERE a.attrelid = c.oid AND a.attname = 'row_version' AND NOT a.attisdropped)
      AND NOT EXISTS (SELECT 1 FROM pg_trigger t WHERE t.tgrelid = c.oid AND t.tgname = 'trg_touch')
      -- partitions inherit the parent's trigger; skip them
      AND NOT EXISTS (SELECT 1 FROM pg_inherits i WHERE i.inhrelid = c.oid)
  LOOP
    EXECUTE format('CREATE TRIGGER trg_touch BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION core.tg_touch()', r.tbl);
  END LOOP;
END $$;

-- ─── 2 · Attach row audit to security- and workflow-critical tables ───────
-- (Append-only trails and high-churn queues are excluded by design; the
-- domain history tables already are their own audit.)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'iam.user_account','iam.credential','iam.role','iam.role_permission',
    'iam.user_role','iam.resource_grant','iam.interaction_policy',
    'party.party','party.person','party.party_org','party.contact_point',
    'hr.employee','hr.capacity_target',
    'crm.lead','crm.client_account','crm.lead_assignment',
    'proj.project','proj.project_phase','proj.milestone','proj.deliverable','proj.project_member',
    'work.work_package','work.task','work.task_assignment',
    'bim.rfi','bim.issue',
    'wf.workflow_instance',
    'dms.document','dms.document_version','dms.document_link',
    'comms.meeting'
  ]
  LOOP
    EXECUTE format('CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON %s FOR EACH ROW EXECUTE FUNCTION audit.tg_row_audit()', t);
  END LOOP;
END $$;

-- ─── 3 · Application role and grants ───────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ecobim_app') THEN
    CREATE ROLE ecobim_app NOLOGIN;   -- attach LOGIN users via: GRANT ecobim_app TO <user>;
  END IF;
END $$;

DO $$
DECLARE s text;
BEGIN
  FOREACH s IN ARRAY ARRAY['core','party','iam','hr','crm','proj','work','timelog','bim','wf','dms','comms','audit','bi','ops']
  LOOP
    EXECUTE format('GRANT USAGE ON SCHEMA %I TO ecobim_app', s);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA %I TO ecobim_app', s);
    EXECUTE format('GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA %I TO ecobim_app', s);
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ecobim_app', s);
  END LOOP;
END $$;

-- The audit log is written only via the SECURITY DEFINER trigger; the app
-- role may read it (admin screens) but never write or delete directly.
-- Partition ACLs do not inherit, so revoke on existing partitions as well
-- (pg_partman post-create hooks must repeat this for future partitions).
REVOKE INSERT, UPDATE, DELETE ON audit.audit_log FROM ecobim_app;
REVOKE INSERT, UPDATE, DELETE ON audit.audit_log_default FROM ecobim_app;

-- ─── 4 · Row-Level Security: tenant isolation ──────────────────────────────
-- Policy: rows are visible/writable only within the caller's organization
-- (SET app.org_id = '<uuid>'). Tables whose organization_id is nullable
-- hold global/system rows (system roles, global lookups, workflow defs)
-- which every tenant may read → OR IS NULL variant.
-- The migration owner bypasses RLS (tables are not FORCE RLS); ecobim_app
-- is fully subject to it. Application-layer authorization remains the
-- primary gate — RLS is defense in depth.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.oid::regclass AS tbl, a.attnotnull AS org_not_null
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'organization_id' AND NOT a.attisdropped
    WHERE n.nspname IN ('core','party','iam','hr','crm','proj','work','timelog','bim','wf','dms','comms','audit','bi','ops')
      AND c.relkind IN ('r','p')
      AND NOT EXISTS (SELECT 1 FROM pg_inherits i WHERE i.inhrelid = c.oid)
  LOOP
    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', r.tbl);
    IF r.org_not_null THEN
      EXECUTE format(
        'CREATE POLICY tenant_isolation ON %s FOR ALL TO ecobim_app
           USING (organization_id = core.current_org_id())
           WITH CHECK (organization_id = core.current_org_id())', r.tbl);
    ELSE
      EXECUTE format(
        'CREATE POLICY tenant_isolation ON %s FOR ALL TO ecobim_app
           USING (organization_id = core.current_org_id() OR organization_id IS NULL)
           WITH CHECK (organization_id = core.current_org_id() OR organization_id IS NULL)', r.tbl);
    END IF;
  END LOOP;
END $$;

-- core.organization has no organization_id column; scope it to itself.
ALTER TABLE core.organization ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON core.organization FOR ALL TO ecobim_app
  USING (id = core.current_org_id())
  WITH CHECK (id = core.current_org_id());

COMMIT;
