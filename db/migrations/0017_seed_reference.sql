-- ═══════════════════════════════════════════════════════════════════════════
-- EcoBIM ERP · 0017 · Reference data (global seeds)
-- Codes and colors mirror the frontend's STATUS_DOT / BADGE_CFG so the UI
-- can become fully data-driven. Safe to re-run (ON CONFLICT DO NOTHING).
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

-- ─── Priorities (also used as issue severity) ──────────────────────────────
INSERT INTO core.priority (code, label, sort_order, color) VALUES
  ('HIGH',   'High',   1, '#C0392B'),
  ('MEDIUM', 'Medium', 2, '#B8860B'),
  ('LOW',    'Low',    3, '#8A867C')
ON CONFLICT (code) DO NOTHING;

-- ─── Status tables ─────────────────────────────────────────────────────────
INSERT INTO work.task_status (code, label, sort_order, color) VALUES
  ('NOT_STARTED', 'Not Started', 1, '#8A867C'),
  ('PENDING',     'Pending',     2, '#B7770D'),
  ('IN_PROGRESS', 'In Progress', 3, '#171717'),
  ('DELAYED',     'Delayed',     4, '#C0392B'),
  ('COMPLETED',   'Completed',   5, '#1A7A4A'),
  ('CANCELLED',   'Cancelled',   6, '#BDBDBD')
ON CONFLICT (code) DO NOTHING;

INSERT INTO bim.rfi_status (code, label, sort_order, color) VALUES
  ('PENDING',     'Pending',     1, '#B7770D'),
  ('IN_PROGRESS', 'In Progress', 2, '#171717'),
  ('RESPONDED',   'Responded',   3, '#3B9EFF'),
  ('CLOSED',      'Closed',      4, '#1A7A4A')
ON CONFLICT (code) DO NOTHING;

INSERT INTO bim.issue_status (code, label, sort_order, color) VALUES
  ('PENDING',     'Pending',     1, '#B7770D'),
  ('IN_PROGRESS', 'In Progress', 2, '#171717'),
  ('ESCALATED',   'Escalated',   3, '#C0392B'),
  ('RESOLVED',    'Resolved',    4, '#1A7A4A'),
  ('CLOSED',      'Closed',      5, '#1A7A4A')
ON CONFLICT (code) DO NOTHING;

INSERT INTO crm.lead_status (code, label, sort_order, color) VALUES
  ('NEW',       'New',       1, '#171717'),
  ('CONTACTED', 'Contacted', 2, '#B8860B'),
  ('ASSIGNED',  'Assigned',  3, '#1A7A4A'),
  ('CONVERTED', 'Converted', 4, '#1A7A4A'),
  ('LOST',      'Lost',      5, '#8A867C')
ON CONFLICT (code) DO NOTHING;

INSERT INTO proj.project_status (code, label, sort_order, color) VALUES
  ('PLANNED',   'Planned',   1, '#8A867C'),
  ('ACTIVE',    'Active',    2, '#171717'),
  ('ON_HOLD',   'On Hold',   3, '#B7770D'),
  ('COMPLETED', 'Completed', 4, '#1A7A4A'),
  ('ARCHIVED',  'Archived',  5, '#BDBDBD')
ON CONFLICT (code) DO NOTHING;

INSERT INTO dms.doc_state (code, label, sort_order) VALUES
  ('WIP',       'Work in Progress', 1),
  ('SHARED',    'Shared',           2),
  ('PUBLISHED', 'Published',        3),
  ('ARCHIVED',  'Archived',         4)
ON CONFLICT (code) DO NOTHING;

-- ─── Lookup vocabularies ───────────────────────────────────────────────────
INSERT INTO core.lookup_type (code, label) VALUES
  ('PROJECT_PHASE',    'Project delivery phase'),
  ('LOD',              'Level of Development'),
  ('DELIVERABLE_TYPE', 'Deliverable type'),
  ('WORK_TYPE',        'Time entry work type'),
  ('DISCIPLINE',       'BIM discipline'),
  ('PROJECT_TYPE',     'Project type'),
  ('DOC_TYPE',         'Document type')
ON CONFLICT (code) DO NOTHING;

INSERT INTO core.lookup_value (type_code, code, label, sort_order, color) VALUES
  ('PROJECT_PHASE', 'CONCEPT',      'Concept',                 1, NULL),
  ('PROJECT_PHASE', 'SD',           'Schematic Design',        2, NULL),
  ('PROJECT_PHASE', 'DD',           'Design Development',      3, NULL),
  ('PROJECT_PHASE', 'CD',           'Construction Documents',  4, NULL),
  ('PROJECT_PHASE', 'TENDER',       'Tender',                  5, NULL),
  ('PROJECT_PHASE', 'CONSTRUCTION', 'Construction',            6, NULL),
  ('LOD', 'LOD_100', 'LOD 100', 1, NULL),
  ('LOD', 'LOD_150', 'LOD 150', 2, NULL),
  ('LOD', 'LOD_200', 'LOD 200', 3, NULL),
  ('LOD', 'LOD_250', 'LOD 250', 4, NULL),
  ('LOD', 'LOD_300', 'LOD 300', 5, NULL),
  ('LOD', 'LOD_350', 'LOD 350', 6, NULL),
  ('LOD', 'LOD_400', 'LOD 400', 7, NULL),
  ('DELIVERABLE_TYPE', 'MODEL',    'Model',    1, NULL),
  ('DELIVERABLE_TYPE', 'REPORT',   'Report',   2, NULL),
  ('DELIVERABLE_TYPE', 'DRAWINGS', 'Drawings', 3, NULL),
  ('DELIVERABLE_TYPE', 'RFI',      'RFI',      4, NULL),
  ('DELIVERABLE_TYPE', 'TASK',     'Task',     5, NULL),
  ('WORK_TYPE', 'MODELING',      'Modeling',      1, NULL),
  ('WORK_TYPE', 'COORDINATION',  'Coordination',  2, NULL),
  ('WORK_TYPE', 'RFI',           'RFI',           3, NULL),
  ('WORK_TYPE', 'DOCUMENTATION', 'Documentation', 4, NULL),
  ('DISCIPLINE', 'ARCH', 'Architecture', 1, NULL),
  ('DISCIPLINE', 'STR',  'Structure',    2, NULL),
  ('DISCIPLINE', 'MEP',  'MEP',          3, NULL),
  ('PROJECT_TYPE', 'RESIDENTIAL',         'Residential',         1, NULL),
  ('PROJECT_TYPE', 'COMMERCIAL',          'Commercial',          2, NULL),
  ('PROJECT_TYPE', 'PRIVATE_RESIDENTIAL', 'Private Residential', 3, NULL),
  ('PROJECT_TYPE', 'MIXED_USE',           'Mixed Use',           4, NULL),
  ('DOC_TYPE', 'DRAWINGS', 'Drawings', 1, NULL),
  ('DOC_TYPE', 'MODEL',    'Model',    2, NULL),
  ('DOC_TYPE', 'REPORT',   'Report',   3, NULL)
ON CONFLICT DO NOTHING;

-- ─── Service catalog (global — the website's service chips) ────────────────
INSERT INTO crm.service_catalog (code, name, sort_order) VALUES
  ('3D_MODELING',        '3D Modeling',        1),
  ('CLASH_COORDINATION', 'Clash Coordination', 2),
  ('SHOP_DRAWINGS',      'Shop Drawings',      3),
  ('QTO',                'Quantity Takeoff',   4),
  ('4D_5D',              '4D / 5D',            5),
  ('SCAN_TO_BIM',        'Scan to BIM',        6)
ON CONFLICT DO NOTHING;

-- ─── Permission catalog ────────────────────────────────────────────────────
INSERT INTO iam.permission (code, module, description) VALUES
  ('project.view',          'proj',  'View projects and portfolio'),
  ('project.manage',        'proj',  'Create/edit projects, phases, milestones'),
  ('task.view',             'work',  'View tasks'),
  ('task.create',           'work',  'Create and assign tasks'),
  ('task.update',           'work',  'Update task progress/status'),
  ('task.complete',         'work',  'Mark tasks complete'),
  ('time.log',              'time',  'Log time entries'),
  ('time.view_own',         'time',  'View own productivity'),
  ('time.view_all',         'time',  'View any employee productivity'),
  ('rfi.view',              'bim',   'View RFIs'),
  ('rfi.manage',            'bim',   'Create/assign RFIs'),
  ('rfi.respond',           'bim',   'Respond to RFIs'),
  ('issue.view',            'bim',   'View issues'),
  ('issue.create',          'bim',   'Raise issues'),
  ('issue.resolve',         'bim',   'Resolve issues'),
  ('issue.escalate',        'bim',   'Escalate issues to admin'),
  ('issue.respond',         'bim',   'Respond to issues'),
  ('approval.request',      'wf',    'Request client approval (lead gate)'),
  ('approval.review',       'wf',    'Review approvals (admin gate)'),
  ('approval.client_decide','wf',    'Approve / request revision as client'),
  ('lead.view',             'crm',   'View estimate requests'),
  ('lead.manage',           'crm',   'Triage/contact estimate requests'),
  ('lead.assign',           'crm',   'Assign estimate requests'),
  ('client.manage',         'crm',   'Onboard and manage client accounts'),
  ('people.manage',         'iam',   'Create people, credentials, roles'),
  ('team.manage_own',       'hr',    'Manage own team roster'),
  ('meeting.schedule',      'comms', 'Schedule meetings (within reach policy)'),
  ('message.send',          'comms', 'Send direct messages/pings'),
  ('document.view',         'dms',   'View/download documents'),
  ('document.manage',       'dms',   'Upload and manage documents'),
  ('report.generate',       'bi',    'Generate reports'),
  ('admin.settings',        'core',  'Manage org settings, reach rules, flags')
ON CONFLICT (code) DO NOTHING;

-- ─── System roles + grants ─────────────────────────────────────────────────
INSERT INTO iam.role (code, name, is_system) VALUES
  ('ADMIN',     'Administrator', true),
  ('TEAM_LEAD', 'Team Lead',     true),
  ('EMPLOYEE',  'Employee',      true),
  ('CLIENT',    'Client',        true)
ON CONFLICT DO NOTHING;

-- Admin: everything.
INSERT INTO iam.role_permission (role_id, permission_code)
SELECT r.id, p.code
FROM iam.role r CROSS JOIN iam.permission p
WHERE r.code = 'ADMIN' AND r.organization_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO iam.role_permission (role_id, permission_code)
SELECT r.id, unnest(ARRAY[
  'project.view','task.view','task.create','task.update',
  'time.view_own','time.view_all',
  'rfi.view','rfi.manage','rfi.respond',
  'issue.view','issue.create','issue.resolve','issue.escalate','issue.respond',
  'approval.request','lead.view','lead.assign','team.manage_own',
  'meeting.schedule','message.send','document.view','document.manage'])
FROM iam.role r
WHERE r.code = 'TEAM_LEAD' AND r.organization_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO iam.role_permission (role_id, permission_code)
SELECT r.id, unnest(ARRAY[
  'task.view','task.update','task.complete',
  'time.log','time.view_own',
  'rfi.view','rfi.respond','issue.view','issue.create',
  'meeting.schedule','message.send','document.view'])
FROM iam.role r
WHERE r.code = 'EMPLOYEE' AND r.organization_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO iam.role_permission (role_id, permission_code)
SELECT r.id, unnest(ARRAY[
  'project.view','rfi.view','approval.client_decide',
  'meeting.schedule','document.view'])
FROM iam.role r
WHERE r.code = 'CLIENT' AND r.organization_id IS NULL
ON CONFLICT DO NOTHING;

-- ─── Client-approval workflow (system definition) ──────────────────────────
WITH def AS (
  INSERT INTO wf.workflow_definition (code, name, subject_type)
  VALUES ('CLIENT_APPROVAL', 'Client milestone approval', 'DELIVERABLE')
  ON CONFLICT DO NOTHING
  RETURNING id
),
d AS (
  SELECT id FROM def
  UNION ALL
  SELECT id FROM wf.workflow_definition
  WHERE code = 'CLIENT_APPROVAL' AND organization_id IS NULL
  LIMIT 1
)
INSERT INTO wf.workflow_stage (definition_id, code, label, sort_order, owner_role_id, is_initial, is_terminal)
SELECT d.id, s.code, s.label, s.sort_order,
       (SELECT id FROM iam.role WHERE code = s.owner AND organization_id IS NULL),
       s.is_initial, s.is_terminal
FROM d,
(VALUES
  ('LEAD_REQUESTED',    'Lead Requested',    1, 'ADMIN',     true,  false),
  ('CHANGES_REQUESTED', 'Changes Requested', 2, 'TEAM_LEAD', false, false),
  ('SENT_TO_CLIENT',    'Sent to Client',    3, 'CLIENT',    false, false),
  ('APPROVED',          'Approved',          4, NULL,        false, true),
  ('REJECTED',          'Rejected',          5, NULL,        false, true)
) AS s(code, label, sort_order, owner, is_initial, is_terminal)
ON CONFLICT DO NOTHING;

-- ─── Canned reports ────────────────────────────────────────────────────────
INSERT INTO bi.report_definition (code, name, description) VALUES
  ('PROGRESS',         'Progress Report',  'Full project progress summary across all disciplines and phases.'),
  ('DELAY_ANALYSIS',   'Delay Analysis',   'Root cause breakdown of delayed tasks and critical path impact.'),
  ('TIME_UTILISATION', 'Time Utilisation', 'Hours logged vs estimated per team member and task category.'),
  ('RFI_SUMMARY',      'RFI Summary',      'All open, responded and closed RFIs with resolution timelines.')
ON CONFLICT DO NOTHING;

COMMIT;
