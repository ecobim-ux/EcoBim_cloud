-- ═══════════════════════════════════════════════════════════════════════════
-- EcoBIM ERP · 0021 · Enforce one active team-lead per employee.
-- hr.team/hr.team_member (0005) already model this correctly in shape, but
-- nothing stopped an employee from having more than one *active*
-- (left_on IS NULL) membership across different teams at once — the app
-- now assigns employees to exactly one team lead at a time (admin-driven,
-- see /api/employees/:id/team-lead), and this partial unique index is the
-- database backstop for that rule, matching the same release-then-insert
-- pattern already used for crm.lead_assignment (ux_lead_assignment_current).
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

CREATE UNIQUE INDEX ux_team_member_current_active
  ON hr.team_member (employee_id) WHERE left_on IS NULL AND deleted_at IS NULL;

COMMIT;
