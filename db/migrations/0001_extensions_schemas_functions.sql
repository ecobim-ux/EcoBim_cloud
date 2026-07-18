-- ═══════════════════════════════════════════════════════════════════════════
-- EcoBIM ERP · 0001 · Extensions, schemas, platform functions
-- Requires: PostgreSQL 15+  (UNIQUE NULLS NOT DISTINCT, partitioned-table
-- row triggers, gen_random_uuid built-in)
-- Run as the migration owner role (tables are owned by it; RLS does not
-- apply to the owner, only to the application role — see 0016).
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- crypt()/gen_salt() for dev seeds
CREATE EXTENSION IF NOT EXISTS citext;     -- case-insensitive login ids / emails
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- fuzzy search (command palette)

-- Module boundaries as schemas. NOTE: the time module lives in schema
-- "timelog" (not "time") to avoid the TIME type keyword in qualified names.
CREATE SCHEMA IF NOT EXISTS core;     -- organizations, org structure, lookups
CREATE SCHEMA IF NOT EXISTS party;    -- party model (persons, orgs, contacts)
CREATE SCHEMA IF NOT EXISTS iam;      -- identity & access
CREATE SCHEMA IF NOT EXISTS hr;       -- employment, teams, calendars
CREATE SCHEMA IF NOT EXISTS crm;      -- leads / estimate requests, clients
CREATE SCHEMA IF NOT EXISTS proj;     -- projects, phases, milestones
CREATE SCHEMA IF NOT EXISTS work;     -- work packages, tasks
CREATE SCHEMA IF NOT EXISTS timelog;  -- time entries, timesheets
CREATE SCHEMA IF NOT EXISTS bim;      -- RFIs, issues, models, clashes
CREATE SCHEMA IF NOT EXISTS wf;       -- workflow engine, approvals, reminders
CREATE SCHEMA IF NOT EXISTS dms;      -- documents
CREATE SCHEMA IF NOT EXISTS comms;    -- notifications, meetings, messages
CREATE SCHEMA IF NOT EXISTS audit;    -- audit log, activity feed
CREATE SCHEMA IF NOT EXISTS bi;       -- reporting
CREATE SCHEMA IF NOT EXISTS ops;      -- job queue

-- ─── UUIDv7 (time-ordered) ─────────────────────────────────────────────────
-- Canonical pure-SQL implementation: 48-bit unix-ms timestamp over random
-- bits, version nibble forced to 7. On PG18+ you may swap for native uuidv7().
CREATE OR REPLACE FUNCTION core.uuid_v7()
RETURNS uuid
LANGUAGE sql VOLATILE PARALLEL SAFE
AS $$
  SELECT encode(
    set_bit(
      set_bit(
        overlay(uuid_send(gen_random_uuid())
                PLACING substring(int8send(floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint) FROM 3)
                FROM 1 FOR 6),
        52, 1),
      53, 1),
    'hex')::uuid;
$$;

-- ─── Session context helpers ───────────────────────────────────────────────
-- The application sets these per connection/transaction:
--   SET app.org_id     = '<organization uuid>';
--   SET app.user_id    = '<user_account uuid>';
--   SET app.request_id = '<correlation id>';
CREATE OR REPLACE FUNCTION core.current_org_id()
RETURNS uuid
LANGUAGE sql STABLE PARALLEL SAFE
AS $$ SELECT nullif(current_setting('app.org_id', true), '')::uuid $$;

CREATE OR REPLACE FUNCTION core.current_user_id()
RETURNS uuid
LANGUAGE sql STABLE PARALLEL SAFE
AS $$ SELECT nullif(current_setting('app.user_id', true), '')::uuid $$;

-- ─── Optimistic-locking / touch trigger ────────────────────────────────────
-- Attached in 0016 to every table that has updated_at.
CREATE OR REPLACE FUNCTION core.tg_touch()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at  := now();
  NEW.row_version := OLD.row_version + 1;
  IF NEW.updated_by IS NULL OR NEW.updated_by = OLD.updated_by THEN
    NEW.updated_by := coalesce(core.current_user_id(), NEW.updated_by);
  END IF;
  RETURN NEW;
END $$;

COMMIT;
