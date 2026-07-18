-- ═══════════════════════════════════════════════════════════════════════════
-- EcoBIM ERP · 0015 · Derived read models
-- Everything the frontend hardcodes (progress %, issue counts, rollups,
-- productivity) is computed here — stored aggregates on parents are banned.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

-- Current assignee per task.
CREATE VIEW work.v_task_current_assignee AS
SELECT ta.task_id,
       ta.assignee_person_id,
       p.display_name AS assignee_name
FROM work.task_assignment ta
JOIN party.party p ON p.id = ta.assignee_person_id
WHERE ta.is_current AND ta.deleted_at IS NULL;

-- Hours logged per task (drives the "logged/est" bars and the
-- log-before-complete gate).
CREATE VIEW timelog.v_task_logged_hours AS
SELECT te.task_id, sum(te.hours) AS logged_hours
FROM timelog.time_entry te
WHERE te.deleted_at IS NULL
GROUP BY te.task_id;

-- Work-package rollup — the frontend's wiStatus / wiPct, derived.
CREATE VIEW work.v_work_package_rollup AS
SELECT wp.id AS work_package_id,
       count(t.id) AS task_count,
       count(*) FILTER (WHERE t.status_code = 'COMPLETED') AS completed_count,
       count(*) FILTER (WHERE t.status_code = 'DELAYED')   AS delayed_count,
       CASE
         WHEN count(t.id) = 0 THEN 'PENDING'
         WHEN count(t.id) = count(*) FILTER (WHERE t.status_code = 'COMPLETED') THEN 'COMPLETED'
         ELSE 'IN_PROGRESS'
       END AS rollup_status,
       coalesce(round(100.0 * count(*) FILTER (WHERE t.status_code = 'COMPLETED')
                      / nullif(count(t.id), 0)), 0)::int AS rollup_pct
FROM work.work_package wp
LEFT JOIN work.task t ON t.work_package_id = wp.id AND t.deleted_at IS NULL
WHERE wp.deleted_at IS NULL
GROUP BY wp.id;

-- Task-derived phase progress — compare against the PM-maintained
-- project_phase.percent_complete to monitor drift.
CREATE VIEW proj.v_phase_task_progress AS
SELECT t.project_phase_id,
       count(*) AS task_count,
       coalesce(round(avg(t.percent_complete)), 0)::int AS derived_pct
FROM work.task t
WHERE t.deleted_at IS NULL AND t.project_phase_id IS NOT NULL
GROUP BY t.project_phase_id;

-- Weighted project progress from phase weights.
CREATE VIEW proj.v_project_progress AS
SELECT p.id AS project_id,
       coalesce(round(sum(ph.percent_complete * ph.weight_pct)
                      / nullif(sum(ph.weight_pct), 0), 1), 0) AS progress_pct
FROM proj.project p
LEFT JOIN proj.project_phase ph ON ph.project_id = p.id AND ph.deleted_at IS NULL
WHERE p.deleted_at IS NULL
GROUP BY p.id;

-- Open coordination counts per project (portfolio cards, stat tiles).
CREATE VIEW proj.v_project_open_counts AS
SELECT p.id AS project_id,
       (SELECT count(*) FROM bim.issue i
         WHERE i.project_id = p.id AND i.deleted_at IS NULL
           AND i.status_code NOT IN ('RESOLVED','CLOSED')) AS open_issues,
       (SELECT count(*) FROM bim.rfi r
         WHERE r.project_id = p.id AND r.deleted_at IS NULL
           AND r.status_code NOT IN ('RESPONDED','CLOSED')) AS open_rfis
FROM proj.project p
WHERE p.deleted_at IS NULL;

-- Admin portfolio grid, one row per project.
CREATE VIEW proj.v_portfolio AS
SELECT p.id, p.organization_id, p.code, p.name, p.status_code,
       p.planned_start, p.planned_end,
       ca.id  AS client_account_id,
       cap.display_name AS client_name,
       lep.display_name AS lead_name,
       pr.progress_pct,
       oc.open_issues, oc.open_rfis,
       tm.team_size
FROM proj.project p
LEFT JOIN crm.client_account ca ON ca.id = p.client_account_id AND ca.deleted_at IS NULL
LEFT JOIN party.party cap ON cap.id = ca.party_org_id
LEFT JOIN hr.employee le ON le.id = p.lead_employee_id AND le.deleted_at IS NULL
LEFT JOIN party.party lep ON lep.id = le.person_id
LEFT JOIN proj.v_project_progress pr ON pr.project_id = p.id
LEFT JOIN proj.v_project_open_counts oc ON oc.project_id = p.id
LEFT JOIN LATERAL (
  SELECT count(*) AS team_size
  FROM proj.project_member m
  WHERE m.project_id = p.id AND m.deleted_at IS NULL
    AND (m.active_to IS NULL OR m.active_to >= current_date)
) tm ON true
WHERE p.deleted_at IS NULL;

-- Weekly productivity: materialized for dashboard speed, unique-indexed for
-- REFRESH MATERIALIZED VIEW CONCURRENTLY (schedule via ops.job_queue).
CREATE MATERIALIZED VIEW timelog.mv_weekly_hours AS
SELECT te.organization_id,
       te.employee_id,
       (date_trunc('week', te.work_date))::date AS week_start,
       sum(te.hours) AS hours
FROM timelog.time_entry te
WHERE te.deleted_at IS NULL
GROUP BY te.organization_id, te.employee_id, (date_trunc('week', te.work_date))::date;

CREATE UNIQUE INDEX ux_mv_weekly_hours ON timelog.mv_weekly_hours (employee_id, week_start);

-- Joined with effective-dated targets → the Productivity tab numbers.
CREATE VIEW timelog.v_weekly_productivity AS
SELECT w.organization_id, w.employee_id, w.week_start, w.hours,
       ct.weekly_hours AS target_hours,
       least(100, coalesce(round(100 * w.hours / nullif(ct.weekly_hours, 0)), 0))::int AS productivity_pct
FROM timelog.mv_weekly_hours w
LEFT JOIN hr.capacity_target ct
  ON ct.employee_id = w.employee_id AND ct.deleted_at IS NULL
 AND ct.effective_from <= w.week_start
 AND (ct.effective_to IS NULL OR ct.effective_to >= w.week_start);

-- Unread notification badge counts per user.
CREATE VIEW comms.v_unread_counts AS
SELECT nd.user_account_id, count(*) AS unread
FROM comms.notification_delivery nd
WHERE nd.read_at IS NULL AND nd.dismissed_at IS NULL
GROUP BY nd.user_account_id;

-- RFI SLA watchlist (calendar-day approximation; business-day precision is
-- computed in the service layer against hr.work_calendar).
CREATE VIEW bim.v_rfi_overdue AS
SELECT r.id, r.organization_id, r.code, r.project_id, r.title,
       r.status_code, r.response_due_on,
       (current_date - r.response_due_on) AS days_overdue
FROM bim.rfi r
WHERE r.deleted_at IS NULL
  AND r.response_due_on IS NOT NULL
  AND r.response_due_on < current_date
  AND r.status_code IN ('PENDING','IN_PROGRESS');

COMMIT;
