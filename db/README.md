# EcoBIM ERP — PostgreSQL Database

Implements the approved architecture (Phases 1–7): a modular-monolith schema for the
EcoBIM project portal (V1) with the extension sockets for future ERP modules
(Finance, HR, Procurement, Inventory, CRM, BIM depth) already in place.

## Requirements

- **PostgreSQL 15+** (uses `UNIQUE NULLS NOT DISTINCT`, partitioned-table row
  triggers, built-in `gen_random_uuid`). Tested syntax targets PG 15–18.
- Extensions (created by migration 0001): `pgcrypto`, `citext`, `pg_trgm`.
- Recommended companions (not required to run): **pg_partman** (partition
  maintenance), **PgBouncer** (transaction pooling).

## Running the migrations

Run in numeric order as a privileged role (the future owner of all objects):

```sh
createdb ecobim
for f in migrations/00*.sql; do psql -d ecobim -v ON_ERROR_STOP=1 -f "$f"; done
```

| File | Contents |
|---|---|
| 0001 | Extensions, 15 module schemas, `core.uuid_v7()`, session helpers, touch trigger fn |
| 0002 | `core`: organization/company/branch/department, lookups, priorities, code sequences, settings |
| 0003 | `party`: party/person/party_org, contacts, addresses, roles, relationships |
| 0004 | `iam`: accounts, credentials, sessions, RBAC, resource grants, interaction (reach) policies, login audit |
| 0005 | `hr`: positions, employees, capacity targets, work calendars, teams |
| 0006 | `crm`: lead statuses, service catalog, client accounts, leads + assignment/history |
| 0007 | `proj`: projects, phases, LOD requirements, members, milestones, deliverables, snapshots |
| 0008 | `work`: work packages, tasks, assignments, dependencies, status history |
| 0009 | `timelog`: time entries (monthly-partitioned), timesheets |
| 0010 | `bim`: RFIs (+responses), issues (+event trail), models/versions, clash sets/items |
| 0011 | `wf`: workflow definitions/stages/instances/actions, reminders |
| 0012 | `dms`: folders, file blobs, documents, versions, typed link table |
| 0013 | `comms`: notifications + per-user deliveries (partitioned), meetings, messages, comments, email outbox (partitioned) |
| 0014 | `audit` (partitioned audit log + generic trigger), `ops.job_queue`, `bi` report defs/runs |
| 0015 | Derived read models: progress, rollups, productivity (matview), unread counts, RFI SLA |
| 0016 | Touch-trigger attachment, audit-trigger attachment, `ecobim_app` role + grants, RLS policies |
| 0017 | Global reference seeds: statuses, lookups, services, permissions, system roles, CLIENT_APPROVAL workflow, canned reports |
| 0018 | **Demo seed (dev/staging only)** — recreates the frontend's mock world: personas, 3 projects, tasks, time, RFIs, issues, approvals, leads, documents |

For production adopt a migration tool (Flyway / Sqitch / dbmate) and register
0001–0017 as the baseline; **never run 0018 in production**.

## Application connection contract

The app connects as a member of the `ecobim_app` role and sets per
connection/transaction:

```sql
SET app.org_id     = '<organization uuid>';  -- tenant (RLS depends on this)
SET app.user_id    = '<user_account uuid>';  -- audit actor
SET app.request_id = '<correlation id>';     -- audit tracing
```

- **RLS**: every tenant table enforces `organization_id = app.org_id`
  (nullable-org tables — system roles, global lookups, workflow definitions —
  additionally allow the shared `NULL` rows). RLS is defense in depth; the
  service layer remains the primary authorization gate (permission checks +
  `iam.resource_grant` scoping for clients).
- **Optimistic locking**: send `row_version` back on UPDATE and include
  `WHERE row_version = $expected`; the touch trigger increments it.
- **Business codes** (`RFI-014`, `REQ-09821`, …): allocate via
  `core.next_code(org_id, series, prefix, pad)` — never derive from timestamps.
- **Passwords**: hash with **argon2id** in the app layer (`iam.credential.algo`
  records the scheme). The demo seed uses bcrypt via pgcrypto only because
  argon2 is unavailable in SQL.

## Partitioning & maintenance

`timelog.time_entry`, `comms.notification_delivery`, `comms.email_outbox`, and
`audit.audit_log` are `PARTITION BY RANGE` on their time column with a
`DEFAULT` partition so inserts always succeed out of the box. Configure
pg_partman (or a cron job) to pre-create monthly partitions and detach/archive
old ones per your retention policy. Schedule
`REFRESH MATERIALIZED VIEW CONCURRENTLY timelog.mv_weekly_hours` (e.g. every
15 min) via `ops.job_queue`.

## Deliberate decisions / deviations from the design doc

1. **Schema `timelog`, not `time`** — avoids the `TIME` keyword in qualified names.
2. **`hr.job_position`, not `position`** — `position(x in y)` is a SQL construct.
3. **`created_by` / `updated_by` have no FK** — audit provenance must survive
   account removal and avoid write-path index overhead; values come from
   `app.user_id`.
4. **Hot statuses are per-domain tables** (`work.task_status`, `bim.rfi_status`,
   `bim.issue_status`, `crm.lead_status`, `proj.project_status`, `dms.doc_state`)
   carrying UI colors seeded from the frontend palette; extensible vocabularies
   use `core.lookup_type/value`. Native enums are avoided entirely.
5. **`project_phase.percent_complete` is stored** (PM-maintained operational
   input, few rows) while project progress, issue counts, package rollups and
   productivity are **derived views** — `proj.v_phase_task_progress` exposes the
   task-derived figure so drift is visible.
6. **Append-only tables** (status histories, workflow actions, issue events,
   audit, login audit) carry no `updated_at`/soft delete by design — they *are*
   the audit trail.
7. **Polymorphic links** are explicit nullable-FK link tables with
   `num_nonnulls(...) = 1` checks (`dms.document_link`, `comms.comment`,
   `wf.reminder`) — real referential integrity over generic elegance.

## What the backend service must enforce (not expressible as constraints)

- Task completion requires logged time (`SUM(time_entry.hours) > 0`).
- Workflow transitions must follow stage order/ownership (`wf.workflow_stage`).
- Meeting invites / issue routing filtered by `iam.interaction_policy`.
- RFI SLA in *business days* against `hr.work_calendar` (+ holidays);
  `bim.v_rfi_overdue` is the calendar-day approximation.
- Notification fan-out: one `comms.notification` + one delivery row per
  *resolved recipient user* (never role-broadcast).
- `bim.issue_event` rows must accompany issue status changes (service writes
  both in one transaction).
