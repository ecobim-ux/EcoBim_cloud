-- ═══════════════════════════════════════════════════════════════════════════
-- EcoBIM ERP · 0018 · DEMO SEED — development/staging only. DO NOT run in
-- production. Recreates the frontend's mock dataset (personas, projects,
-- tasks, time, RFIs, issues, approvals, leads, documents) on the real schema.
-- Dev credentials use bcrypt via pgcrypto; production auth must hash with
-- argon2id in the application layer.
-- ═══════════════════════════════════════════════════════════════════════════
BEGIN;

DO $$
DECLARE
  v_org uuid; v_co uuid; v_br uuid; v_dept uuid; v_team uuid;
  v_pos_lead uuid; v_pos_coord uuid; v_pos_eng uuid; v_pos_jr uuid; v_pos_admin uuid;
  -- parties
  pa_admin uuid; pa_pranav uuid; pa_arjun uuid; pa_sara uuid; pa_vikram uuid; pa_layla uuid;
  pa_marina uuid; pa_emaar uuid; pa_habtoor uuid;
  -- employees
  e_admin uuid; e_pranav uuid; e_arjun uuid; e_sara uuid; e_vikram uuid; e_layla uuid;
  -- accounts / roles
  u_admin uuid; u_pranav uuid; u_arjun uuid; u_sara uuid; u_vikram uuid; u_layla uuid; u_client uuid;
  r_admin uuid; r_lead uuid; r_emp uuid; r_client uuid;
  -- clients / projects
  c_marina uuid; c_emaar uuid; c_habtoor uuid;
  p1 uuid; p2 uuid; p3 uuid;
  ph1_cd uuid;
  ms_cd uuid;
  del_cd uuid; del_dd uuid; del_concept uuid;
  wp1 uuid;
  t01 uuid; t02 uuid; t03 uuid; t04 uuid; t05 uuid; st1 uuid; st2 uuid; st3 uuid;
  rfi14 uuid; rfi11 uuid; iss8 uuid; iss7 uuid; iss5 uuid; iss3 uuid;
  wd uuid; stg_lead uuid; stg_changes uuid; stg_client uuid;
  wi1 uuid; wi2 uuid; wi3 uuid;
  l1 uuid; l2 uuid; l3 uuid;
  lv_phase uuid; d uuid; b uuid; dv uuid;
BEGIN
  -- ─── Organization structure ──────────────────────────────────────────────
  INSERT INTO core.organization (code, name) VALUES ('ECOBIM', 'EcoBIM') RETURNING id INTO v_org;
  INSERT INTO core.company (organization_id, code, name, legal_name)
    VALUES (v_org, 'ECOBIM-AE', 'EcoBIM', 'EcoBIM Engineering Consultancy LLC') RETURNING id INTO v_co;
  INSERT INTO core.branch (organization_id, company_id, code, name, city)
    VALUES (v_org, v_co, 'DXB', 'Dubai HQ', 'Dubai') RETURNING id INTO v_br;
  INSERT INTO core.department (organization_id, company_id, branch_id, code, name)
    VALUES (v_org, v_co, v_br, 'BIM', 'BIM Production & Coordination') RETURNING id INTO v_dept;

  INSERT INTO hr.job_position (organization_id, code, title) VALUES
    (v_org, 'ADMIN',        'Administrator')       RETURNING id INTO v_pos_admin;
  INSERT INTO hr.job_position (organization_id, code, title) VALUES
    (v_org, 'SR_BIM_LEAD',  'Senior BIM Lead')     RETURNING id INTO v_pos_lead;
  INSERT INTO hr.job_position (organization_id, code, title) VALUES
    (v_org, 'BIM_COORD',    'BIM Coordinator')     RETURNING id INTO v_pos_coord;
  INSERT INTO hr.job_position (organization_id, code, title) VALUES
    (v_org, 'BIM_ENG',      'BIM Engineer')        RETURNING id INTO v_pos_eng;
  INSERT INTO hr.job_position (organization_id, code, title) VALUES
    (v_org, 'JR_MODELLER',  'Junior BIM Modeller') RETURNING id INTO v_pos_jr;

  -- ─── People (party + person + email) ─────────────────────────────────────
  INSERT INTO party.party (organization_id, kind, display_name) VALUES (v_org,'PERSON','Admin User')    RETURNING id INTO pa_admin;
  INSERT INTO party.person (party_id, first_name, last_name, initials) VALUES (pa_admin,'Admin','User','AD');
  INSERT INTO party.party (organization_id, kind, display_name) VALUES (v_org,'PERSON','Pranav R.')     RETURNING id INTO pa_pranav;
  INSERT INTO party.person (party_id, first_name, last_name, initials) VALUES (pa_pranav,'Pranav','R.','PR');
  INSERT INTO party.party (organization_id, kind, display_name) VALUES (v_org,'PERSON','Arjun Mehta')   RETURNING id INTO pa_arjun;
  INSERT INTO party.person (party_id, first_name, last_name, initials) VALUES (pa_arjun,'Arjun','Mehta','AM');
  INSERT INTO party.party (organization_id, kind, display_name) VALUES (v_org,'PERSON','Sara Al Rashid') RETURNING id INTO pa_sara;
  INSERT INTO party.person (party_id, first_name, last_name, initials) VALUES (pa_sara,'Sara','Al Rashid','SA');
  INSERT INTO party.party (organization_id, kind, display_name) VALUES (v_org,'PERSON','Vikram Nair')   RETURNING id INTO pa_vikram;
  INSERT INTO party.person (party_id, first_name, last_name, initials) VALUES (pa_vikram,'Vikram','Nair','VN');
  INSERT INTO party.party (organization_id, kind, display_name) VALUES (v_org,'PERSON','Layla Hassan')  RETURNING id INTO pa_layla;
  INSERT INTO party.person (party_id, first_name, last_name, initials) VALUES (pa_layla,'Layla','Hassan','LH');

  INSERT INTO party.contact_point (organization_id, party_id, kind, value, is_primary) VALUES
    (v_org, pa_admin,  'EMAIL', 'info@ecobim.co',    true),
    (v_org, pa_pranav, 'EMAIL', 'pranav@ecobim.com', true),
    (v_org, pa_arjun,  'EMAIL', 'arjun@ecobim.com',  true),
    (v_org, pa_sara,   'EMAIL', 'sara@ecobim.com',   true),
    (v_org, pa_vikram, 'EMAIL', 'vikram@ecobim.com', true),
    (v_org, pa_layla,  'EMAIL', 'layla@ecobim.com',  true);

  INSERT INTO party.party_role (organization_id, party_id, role_code)
  SELECT v_org, p, 'EMPLOYEE' FROM unnest(ARRAY[pa_admin,pa_pranav,pa_arjun,pa_sara,pa_vikram,pa_layla]) AS p;

  -- ─── Client companies ────────────────────────────────────────────────────
  INSERT INTO party.party (organization_id, kind, display_name) VALUES (v_org,'ORG','Dubai Marina Developments LLC') RETURNING id INTO pa_marina;
  INSERT INTO party.party_org (party_id, legal_name) VALUES (pa_marina,'Dubai Marina Developments LLC');
  INSERT INTO party.party (organization_id, kind, display_name) VALUES (v_org,'ORG','Emaar Properties') RETURNING id INTO pa_emaar;
  INSERT INTO party.party_org (party_id, legal_name) VALUES (pa_emaar,'Emaar Properties PJSC');
  INSERT INTO party.party (organization_id, kind, display_name) VALUES (v_org,'ORG','Al Habtoor Group') RETURNING id INTO pa_habtoor;
  INSERT INTO party.party_org (party_id, legal_name) VALUES (pa_habtoor,'Al Habtoor Group LLC');

  INSERT INTO party.contact_point (organization_id, party_id, kind, value, is_primary) VALUES
    (v_org, pa_marina,  'EMAIL', 'approvals@dubaimarina-dev.ae', true),
    (v_org, pa_emaar,   'EMAIL', 'pmo@emaar.ae',                 true),
    (v_org, pa_habtoor, 'EMAIL', 'projects@alhabtoor.com',       true);

  INSERT INTO party.party_role (organization_id, party_id, role_code)
  SELECT v_org, p, 'CLIENT' FROM unnest(ARRAY[pa_marina,pa_emaar,pa_habtoor]) AS p;

  -- ─── Employees, capacity, team ───────────────────────────────────────────
  INSERT INTO hr.employee (organization_id, person_id, employee_no, job_position_id, department_id, branch_id, hired_on)
    VALUES (v_org, pa_admin, 'E-001', v_pos_admin, v_dept, v_br, DATE '2024-01-01') RETURNING id INTO e_admin;
  INSERT INTO hr.employee (organization_id, person_id, employee_no, job_position_id, department_id, branch_id, manager_id, hired_on)
    VALUES (v_org, pa_pranav, 'E-002', v_pos_lead, v_dept, v_br, e_admin, DATE '2024-01-01') RETURNING id INTO e_pranav;
  INSERT INTO hr.employee (organization_id, person_id, employee_no, job_position_id, department_id, branch_id, manager_id, hired_on)
    VALUES (v_org, pa_arjun, 'E-003', v_pos_coord, v_dept, v_br, e_pranav, DATE '2024-03-01') RETURNING id INTO e_arjun;
  INSERT INTO hr.employee (organization_id, person_id, employee_no, job_position_id, department_id, branch_id, manager_id, hired_on)
    VALUES (v_org, pa_sara, 'E-004', v_pos_eng, v_dept, v_br, e_pranav, DATE '2024-03-01') RETURNING id INTO e_sara;
  INSERT INTO hr.employee (organization_id, person_id, employee_no, job_position_id, department_id, branch_id, manager_id, hired_on)
    VALUES (v_org, pa_vikram, 'E-005', v_pos_coord, v_dept, v_br, e_pranav, DATE '2024-06-01') RETURNING id INTO e_vikram;
  INSERT INTO hr.employee (organization_id, person_id, employee_no, job_position_id, department_id, branch_id, manager_id, hired_on)
    VALUES (v_org, pa_layla, 'E-006', v_pos_jr, v_dept, v_br, e_pranav, DATE '2025-01-01') RETURNING id INTO e_layla;

  INSERT INTO hr.capacity_target (organization_id, employee_id, weekly_hours, effective_from) VALUES
    (v_org, e_arjun,  40, DATE '2025-01-01'),
    (v_org, e_sara,   36, DATE '2025-01-01'),
    (v_org, e_vikram, 30, DATE '2025-01-01'),
    (v_org, e_layla,  24, DATE '2025-01-01');

  INSERT INTO hr.team (organization_id, department_id, code, name, lead_employee_id)
    VALUES (v_org, v_dept, 'BIM-A', 'BIM Coordination Team A', e_pranav) RETURNING id INTO v_team;
  INSERT INTO hr.team_member (organization_id, team_id, employee_id)
  SELECT v_org, v_team, e FROM unnest(ARRAY[e_arjun,e_sara,e_vikram,e_layla]) AS e;

  -- ─── Accounts, credentials (dev bcrypt), role grants ─────────────────────
  SELECT id INTO r_admin  FROM iam.role WHERE code='ADMIN'     AND organization_id IS NULL;
  SELECT id INTO r_lead   FROM iam.role WHERE code='TEAM_LEAD' AND organization_id IS NULL;
  SELECT id INTO r_emp    FROM iam.role WHERE code='EMPLOYEE'  AND organization_id IS NULL;
  SELECT id INTO r_client FROM iam.role WHERE code='CLIENT'    AND organization_id IS NULL;

  INSERT INTO iam.user_account (organization_id, party_id, login_id, status) VALUES (v_org, pa_admin,  'Admin',  'ACTIVE') RETURNING id INTO u_admin;
  INSERT INTO iam.user_account (organization_id, party_id, login_id, status) VALUES (v_org, pa_pranav, 'led',    'ACTIVE') RETURNING id INTO u_pranav;
  INSERT INTO iam.user_account (organization_id, party_id, login_id, status) VALUES (v_org, pa_arjun,  'ABC',    'ACTIVE') RETURNING id INTO u_arjun;
  INSERT INTO iam.user_account (organization_id, party_id, login_id, status) VALUES (v_org, pa_sara,   'sara',   'ACTIVE') RETURNING id INTO u_sara;
  INSERT INTO iam.user_account (organization_id, party_id, login_id, status) VALUES (v_org, pa_vikram, 'vikram', 'ACTIVE') RETURNING id INTO u_vikram;
  INSERT INTO iam.user_account (organization_id, party_id, login_id, status) VALUES (v_org, pa_layla,  'layla',  'ACTIVE') RETURNING id INTO u_layla;
  INSERT INTO iam.user_account (organization_id, party_id, login_id, status) VALUES (v_org, pa_marina, 'Client', 'ACTIVE') RETURNING id INTO u_client;

  INSERT INTO iam.credential (organization_id, user_account_id, kind, secret_hash, algo) VALUES
    (v_org, u_admin,  'PASSWORD', crypt('Admin@1',  gen_salt('bf', 12)), 'bcrypt'),
    (v_org, u_pranav, 'PASSWORD', crypt('led@1',    gen_salt('bf', 12)), 'bcrypt'),
    (v_org, u_arjun,  'PASSWORD', crypt('123',      gen_salt('bf', 12)), 'bcrypt'),
    (v_org, u_sara,   'PASSWORD', crypt('ecobim@1', gen_salt('bf', 12)), 'bcrypt'),
    (v_org, u_vikram, 'PASSWORD', crypt('ecobim@1', gen_salt('bf', 12)), 'bcrypt'),
    (v_org, u_layla,  'PASSWORD', crypt('ecobim@1', gen_salt('bf', 12)), 'bcrypt'),
    (v_org, u_client, 'PASSWORD', crypt('Client@1', gen_salt('bf', 12)), 'bcrypt');

  INSERT INTO iam.user_role (user_account_id, role_id) VALUES
    (u_admin, r_admin), (u_pranav, r_lead), (u_arjun, r_emp), (u_sara, r_emp),
    (u_vikram, r_emp), (u_layla, r_emp), (u_client, r_client);

  -- Reach-out matrix (frontend SEED_REACH) as MEETING_INVITE policies.
  INSERT INTO iam.interaction_policy (organization_id, from_role_id, to_role_id, interaction_code) VALUES
    (v_org, r_client, r_admin,  'MEETING_INVITE'),
    (v_org, r_admin,  r_admin,  'MEETING_INVITE'),
    (v_org, r_admin,  r_lead,   'MEETING_INVITE'),
    (v_org, r_admin,  r_emp,    'MEETING_INVITE'),
    (v_org, r_admin,  r_client, 'MEETING_INVITE'),
    (v_org, r_lead,   r_emp,    'MEETING_INVITE'),
    (v_org, r_lead,   r_admin,  'MEETING_INVITE'),
    (v_org, r_emp,    r_lead,   'MEETING_INVITE');

  -- ─── Client accounts ─────────────────────────────────────────────────────
  INSERT INTO crm.client_account (organization_id, code, party_org_id, primary_contact_party_id, owner_employee_id, onboarded_on)
    VALUES (v_org, 'CLT-000001', pa_marina, pa_marina, e_pranav, DATE '2025-01-10') RETURNING id INTO c_marina;
  INSERT INTO crm.client_account (organization_id, code, party_org_id, owner_employee_id, onboarded_on)
    VALUES (v_org, 'CLT-000002', pa_emaar, e_pranav, DATE '2025-03-01') RETURNING id INTO c_emaar;
  INSERT INTO crm.client_account (organization_id, code, party_org_id, owner_employee_id, onboarded_on)
    VALUES (v_org, 'CLT-000003', pa_habtoor, e_pranav, DATE '2025-05-01') RETURNING id INTO c_habtoor;

  INSERT INTO iam.resource_grant (organization_id, user_account_id, resource_type, resource_id, capability)
    VALUES (v_org, u_client, 'CLIENT_ACCOUNT', c_marina, 'VIEW');

  -- ─── Projects + phases ───────────────────────────────────────────────────
  INSERT INTO proj.project (organization_id, code, name, client_account_id, lead_employee_id, status_code,
                            project_type_id, planned_start, planned_end)
    VALUES (v_org, 'PRJ-0001', 'Dubai Marina Tower', c_marina, e_pranav, 'ACTIVE',
            (SELECT id FROM core.lookup_value WHERE type_code='PROJECT_TYPE' AND code='RESIDENTIAL' AND organization_id IS NULL),
            DATE '2025-01-01', DATE '2025-12-31') RETURNING id INTO p1;
  INSERT INTO proj.project (organization_id, code, name, client_account_id, lead_employee_id, status_code,
                            project_type_id, planned_start, planned_end)
    VALUES (v_org, 'PRJ-0002', 'Downtown Mixed-Use Podium', c_emaar, e_pranav, 'ACTIVE',
            (SELECT id FROM core.lookup_value WHERE type_code='PROJECT_TYPE' AND code='COMMERCIAL' AND organization_id IS NULL),
            DATE '2025-03-01', DATE '2026-02-28') RETURNING id INTO p2;
  INSERT INTO proj.project (organization_id, code, name, client_account_id, lead_employee_id, status_code,
                            project_type_id, planned_start, planned_end)
    VALUES (v_org, 'PRJ-0003', 'Jumeirah Villa Complex', c_habtoor, e_pranav, 'ACTIVE',
            (SELECT id FROM core.lookup_value WHERE type_code='PROJECT_TYPE' AND code='PRIVATE_RESIDENTIAL' AND organization_id IS NULL),
            DATE '2025-05-01', DATE '2026-04-30') RETURNING id INTO p3;

  -- p1 phases: weights are the frontend Gantt segment widths; CD active @68%.
  INSERT INTO proj.project_phase (organization_id, project_id, phase_id, weight_pct, percent_complete, gate_status)
  SELECT v_org, p1,
         (SELECT id FROM core.lookup_value WHERE type_code='PROJECT_PHASE' AND code=x.code AND organization_id IS NULL),
         x.w, x.pct, x.gate
  FROM (VALUES
    ('CONCEPT', 12, 100, 'DONE'), ('SD', 13, 100, 'DONE'), ('DD', 15, 100, 'DONE'),
    ('CD', 25, 68, 'ACTIVE'), ('TENDER', 17, 0, 'UPCOMING'), ('CONSTRUCTION', 18, 0, 'UPCOMING')
  ) AS x(code, w, pct, gate);
  SELECT id INTO ph1_cd FROM proj.project_phase
   WHERE project_id = p1
     AND phase_id = (SELECT id FROM core.lookup_value WHERE type_code='PROJECT_PHASE' AND code='CD' AND organization_id IS NULL);

  INSERT INTO proj.project_phase (organization_id, project_id, phase_id, weight_pct, percent_complete, gate_status)
  SELECT v_org, p2,
         (SELECT id FROM core.lookup_value WHERE type_code='PROJECT_PHASE' AND code=x.code AND organization_id IS NULL),
         x.w, x.pct, x.gate
  FROM (VALUES
    ('CONCEPT', 15, 100, 'DONE'), ('SD', 20, 100, 'DONE'), ('DD', 25, 42, 'ACTIVE'),
    ('CD', 20, 0, 'UPCOMING'), ('TENDER', 10, 0, 'UPCOMING'), ('CONSTRUCTION', 10, 0, 'UPCOMING')
  ) AS x(code, w, pct, gate);

  INSERT INTO proj.project_phase (organization_id, project_id, phase_id, weight_pct, percent_complete, gate_status)
  SELECT v_org, p3,
         (SELECT id FROM core.lookup_value WHERE type_code='PROJECT_PHASE' AND code=x.code AND organization_id IS NULL),
         x.w, x.pct, x.gate
  FROM (VALUES
    ('CONCEPT', 20, 18, 'ACTIVE'), ('SD', 20, 0, 'UPCOMING'), ('DD', 20, 0, 'UPCOMING'),
    ('CD', 20, 0, 'UPCOMING'), ('TENDER', 10, 0, 'UPCOMING'), ('CONSTRUCTION', 10, 0, 'UPCOMING')
  ) AS x(code, w, pct, gate);

  -- Members
  INSERT INTO proj.project_member (organization_id, project_id, person_id, project_role) VALUES
    (v_org, p1, pa_pranav, 'Team Lead'),
    (v_org, p1, pa_arjun,  'BIM Coordinator'),
    (v_org, p1, pa_sara,   'BIM Engineer'),
    (v_org, p2, pa_vikram, 'BIM Coordinator'),
    (v_org, p3, pa_layla,  'Junior BIM Modeller');

  -- p1 milestones (frontend MILESTONES)
  INSERT INTO proj.milestone (organization_id, project_id, project_phase_id, label, due_on, status, completed_on)
  VALUES
    (v_org, p1, NULL,   'Concept Model Submission',     DATE '2025-02-28', 'DONE',     DATE '2025-02-28'),
    (v_org, p1, NULL,   'Schematic Design LOD 200',     DATE '2025-04-30', 'DONE',     DATE '2025-04-30'),
    (v_org, p1, NULL,   'Design Development LOD 300',   DATE '2025-06-30', 'DONE',     DATE '2025-06-30'),
    (v_org, p1, ph1_cd, 'Construction Docs LOD 350',    DATE '2025-08-31', 'ACTIVE',   NULL),
    (v_org, p1, NULL,   'Tender Package Submission',    DATE '2025-10-31', 'UPCOMING', NULL),
    (v_org, p1, NULL,   'LOD 400 Fabrication Models',   DATE '2025-12-31', 'UPCOMING', NULL);
  SELECT id INTO ms_cd FROM proj.milestone WHERE project_id = p1 AND label = 'Construction Docs LOD 350';

  -- Approval subjects
  INSERT INTO proj.deliverable (organization_id, project_id, milestone_id, name, deliverable_type_id)
    VALUES (v_org, p1, ms_cd, 'CD Model Submission',
      (SELECT id FROM core.lookup_value WHERE type_code='DELIVERABLE_TYPE' AND code='MODEL' AND organization_id IS NULL))
    RETURNING id INTO del_cd;
  INSERT INTO proj.deliverable (organization_id, project_id, name, deliverable_type_id)
    VALUES (v_org, p2, 'DD Coordination Model',
      (SELECT id FROM core.lookup_value WHERE type_code='DELIVERABLE_TYPE' AND code='MODEL' AND organization_id IS NULL))
    RETURNING id INTO del_dd;
  INSERT INTO proj.deliverable (organization_id, project_id, name, deliverable_type_id)
    VALUES (v_org, p3, 'Concept Massing Sign-off',
      (SELECT id FROM core.lookup_value WHERE type_code='DELIVERABLE_TYPE' AND code='MODEL' AND organization_id IS NULL))
    RETURNING id INTO del_concept;

  -- ─── Work package + tasks ────────────────────────────────────────────────
  INSERT INTO work.work_package (organization_id, code, project_id, title, description, due_on, lead_employee_id)
    VALUES (v_org, 'WI-1001', p1, 'CD Package — Tower Levels 9–16',
            'Produce coordinated CD set for levels 9–16 including MEP coordination and clash resolution.',
            DATE '2026-07-30', e_pranav) RETURNING id INTO wp1;

  INSERT INTO work.task (organization_id, code, project_id, work_package_id, project_phase_id, title,
                         priority_code, status_code, percent_complete, due_on, completed_at)
    VALUES (v_org, 'TSK-000101', p1, wp1, ph1_cd, 'MEP model update — L9–12',
            'MEDIUM', 'COMPLETED', 100, DATE '2026-07-15', TIMESTAMPTZ '2026-07-14 16:00+04') RETURNING id INTO st1;
  INSERT INTO work.task (organization_id, code, project_id, work_package_id, project_phase_id, title,
                         priority_code, status_code, percent_complete, due_on)
    VALUES (v_org, 'TSK-000102', p1, wp1, ph1_cd, 'Clash run & BCF log — L9–16',
            'MEDIUM', 'PENDING', 0, DATE '2026-07-18') RETURNING id INTO st2;
  INSERT INTO work.task (organization_id, code, project_id, work_package_id, project_phase_id, title,
                         priority_code, status_code, percent_complete, due_on, delay_reason)
    VALUES (v_org, 'TSK-000103', p1, wp1, ph1_cd, 'Structural model — L13–16',
            'MEDIUM', 'DELAYED', 20, DATE '2026-07-20',
            'Awaiting consultant drawings for L14 transfer slab.') RETURNING id INTO st3;

  -- Arjun's personal board (frontend MY_TASKS T01–T05)
  INSERT INTO work.task (organization_id, code, project_id, project_phase_id, milestone_id, title,
                         deliverable_type_id, lod_id, priority_code, status_code, percent_complete,
                         estimated_hours, due_on, scheduled_on, delay_reason, completed_at)
  VALUES
    (v_org, 'TSK-000001', p1, ph1_cd, ms_cd, 'MEP Routing — Level 5',
     (SELECT id FROM core.lookup_value WHERE type_code='DELIVERABLE_TYPE' AND code='MODEL' AND organization_id IS NULL),
     (SELECT id FROM core.lookup_value WHERE type_code='LOD' AND code='LOD_350' AND organization_id IS NULL),
     'HIGH', 'IN_PROGRESS', 72, 12, DATE '2025-07-15', DATE '2025-07-10', NULL, NULL),
    (v_org, 'TSK-000002', p1, ph1_cd, NULL, 'Structural Clash Report',
     (SELECT id FROM core.lookup_value WHERE type_code='DELIVERABLE_TYPE' AND code='REPORT' AND organization_id IS NULL),
     (SELECT id FROM core.lookup_value WHERE type_code='LOD' AND code='LOD_300' AND organization_id IS NULL),
     'HIGH', 'DELAYED', 45, 10, DATE '2025-07-10', DATE '2025-07-10',
     'Pending structural drawings from consultant. Awaiting response by EOD.', NULL),
    (v_org, 'TSK-000003', p1, ph1_cd, NULL, 'Curtain Wall Drawings',
     (SELECT id FROM core.lookup_value WHERE type_code='DELIVERABLE_TYPE' AND code='DRAWINGS' AND organization_id IS NULL),
     (SELECT id FROM core.lookup_value WHERE type_code='LOD' AND code='LOD_400' AND organization_id IS NULL),
     'MEDIUM', 'NOT_STARTED', 0, 16, DATE '2025-07-22', NULL, NULL, NULL),
    (v_org, 'TSK-000004', p1, ph1_cd, NULL, 'RFI Response — Level 7',
     (SELECT id FROM core.lookup_value WHERE type_code='DELIVERABLE_TYPE' AND code='RFI' AND organization_id IS NULL),
     (SELECT id FROM core.lookup_value WHERE type_code='LOD' AND code='LOD_300' AND organization_id IS NULL),
     'MEDIUM', 'PENDING', 20, 6, DATE '2025-07-12', DATE '2025-07-10', NULL, NULL),
    (v_org, 'TSK-000005', p1, ph1_cd, NULL, 'Arch Model Update — L1–4',
     (SELECT id FROM core.lookup_value WHERE type_code='DELIVERABLE_TYPE' AND code='MODEL' AND organization_id IS NULL),
     (SELECT id FROM core.lookup_value WHERE type_code='LOD' AND code='LOD_300' AND organization_id IS NULL),
     'LOW', 'COMPLETED', 100, 14, DATE '2025-07-05', NULL, NULL, TIMESTAMPTZ '2025-07-05 17:00+04');

  SELECT id INTO t01 FROM work.task WHERE code='TSK-000001' AND organization_id=v_org;
  SELECT id INTO t02 FROM work.task WHERE code='TSK-000002' AND organization_id=v_org;
  SELECT id INTO t03 FROM work.task WHERE code='TSK-000003' AND organization_id=v_org;
  SELECT id INTO t04 FROM work.task WHERE code='TSK-000004' AND organization_id=v_org;
  SELECT id INTO t05 FROM work.task WHERE code='TSK-000005' AND organization_id=v_org;

  INSERT INTO work.task_assignment (organization_id, task_id, assignee_person_id, assigned_by_person_id) VALUES
    (v_org, st1, pa_arjun, pa_admin),
    (v_org, st2, pa_arjun, pa_admin),
    (v_org, st3, pa_sara,  pa_admin),
    (v_org, t01, pa_arjun, pa_pranav),
    (v_org, t02, pa_arjun, pa_pranav),
    (v_org, t03, pa_arjun, pa_admin),
    (v_org, t04, pa_arjun, pa_pranav),
    (v_org, t05, pa_arjun, pa_pranav);

  -- Blocking link behind ISS-007: clash report blocked by consultant input.
  INSERT INTO work.task_dependency (organization_id, predecessor_task_id, successor_task_id)
    VALUES (v_org, t02, t01);

  -- ─── Time entries (frontend TIME_LOGS) ───────────────────────────────────
  INSERT INTO timelog.time_entry (organization_id, employee_id, task_id, work_date, hours, work_type_id)
  SELECT v_org, e_arjun, x.task, x.d, x.h,
         (SELECT id FROM core.lookup_value WHERE type_code='WORK_TYPE' AND code=x.wt AND organization_id IS NULL)
  FROM (VALUES
    (t01, DATE '2025-07-07', 6.5, 'MODELING'),
    (t04, DATE '2025-07-07', 1.0, 'RFI'),
    (t02, DATE '2025-07-08', 4.0, 'COORDINATION'),
    (t01, DATE '2025-07-09', 7.0, 'MODELING'),
    (t03, DATE '2025-07-10', 3.5, 'DOCUMENTATION'),
    (t02, DATE '2025-07-10', 2.5, 'COORDINATION')
  ) AS x(task, d, h, wt);

  -- ─── RFIs ────────────────────────────────────────────────────────────────
  INSERT INTO bim.rfi (organization_id, code, project_id, title, priority_code, status_code,
                       raised_by_party_id, directed_to_party_id, assignee_person_id, raised_on, response_due_on)
    VALUES (v_org, 'RFI-014', p1, 'MEP Routing Conflict — Level 5', 'HIGH', 'PENDING',
            pa_pranav, pa_marina, pa_arjun, DATE '2025-07-08', DATE '2025-07-15') RETURNING id INTO rfi14;
  INSERT INTO bim.rfi (organization_id, code, project_id, title, priority_code, status_code,
                       raised_by_party_id, directed_to_party_id, raised_on, response_due_on)
    VALUES (v_org, 'RFI-011', p1, 'Curtain Wall Spec Clarification', 'MEDIUM', 'RESPONDED',
            pa_pranav, pa_marina, DATE '2025-07-02', DATE '2025-07-09') RETURNING id INTO rfi11;
  INSERT INTO bim.rfi (organization_id, code, project_id, title, priority_code, status_code,
                       raised_by_party_id, raised_on, closed_at)
    VALUES (v_org, 'RFI-009', p2, 'Slab Thickness — Podium', 'LOW', 'CLOSED',
            pa_vikram, DATE '2025-06-24', TIMESTAMPTZ '2025-07-01 12:00+04');
  INSERT INTO bim.rfi (organization_id, code, project_id, title, priority_code, status_code,
                       raised_by_party_id, raised_on)
    VALUES (v_org, 'RFI-007', p1, 'Structural Column Grid Revision', 'HIGH', 'RESPONDED',
            pa_sara, DATE '2025-06-18');

  INSERT INTO bim.rfi_response (organization_id, rfi_id, author_party_id, body, responded_at)
    VALUES (v_org, rfi11, pa_marina,
            'Spec section 08 44 13 applies; proceed with the alternate mullion profile.',
            TIMESTAMPTZ '2025-07-06 10:30+04');

  -- ─── Issues (+ event trail) ──────────────────────────────────────────────
  INSERT INTO bim.issue (organization_id, code, project_id, title, description, severity_code, status_code,
                         category, raised_by_party_id, routed_to_party_id, raised_on)
    VALUES (v_org, 'ISS-008', p1, 'MEP–Structural Clash — Level 5–8',
            'HVAC ducts intersecting with primary steel beams across levels 5–8. Requires structural revision or MEP rerouting.',
            'HIGH', 'IN_PROGRESS', 'CLASH', pa_arjun, pa_pranav, DATE '2025-07-09') RETURNING id INTO iss8;
  INSERT INTO bim.issue (organization_id, code, project_id, title, description, severity_code, status_code,
                         category, raised_by_party_id, routed_to_party_id, raised_on)
    VALUES (v_org, 'ISS-007', p1, 'Delayed Structural Drawings',
            'Structural consultant drawings for podium levels 1–3 not received. Blocking model update and coordination milestone.',
            'HIGH', 'PENDING', 'DELAY', pa_sara, pa_pranav, DATE '2025-07-08') RETURNING id INTO iss7;
  INSERT INTO bim.issue (organization_id, code, project_id, title, description, severity_code, status_code,
                         category, raised_by_party_id, raised_on)
    VALUES (v_org, 'ISS-005', p1, 'LOD Mismatch — Curtain Wall',
            'Curtain wall modeled at LOD 300 but project BEP requires LOD 400 for CD phase.',
            'MEDIUM', 'IN_PROGRESS', 'COMPLIANCE', pa_pranav, DATE '2025-07-03') RETURNING id INTO iss5;
  INSERT INTO bim.issue (organization_id, code, project_id, title, description, severity_code, status_code,
                         category, raised_by_party_id, raised_on)
    VALUES (v_org, 'ISS-003', p1, 'RFI Response Overdue — Client',
            'Client approval for RFI-011 is overdue by 5 business days. Impacting curtain wall drawing schedule.',
            'MEDIUM', 'PENDING', 'APPROVAL', pa_pranav, DATE '2025-06-28') RETURNING id INTO iss3;

  INSERT INTO bim.issue_event (organization_id, issue_id, event_code, actor_party_id, occurred_at)
  SELECT v_org, i, 'CREATED', a, t FROM (VALUES
    (iss8, pa_arjun,  TIMESTAMPTZ '2025-07-09 09:00+04'),
    (iss7, pa_sara,   TIMESTAMPTZ '2025-07-08 09:00+04'),
    (iss5, pa_pranav, TIMESTAMPTZ '2025-07-03 09:00+04'),
    (iss3, pa_pranav, TIMESTAMPTZ '2025-06-28 09:00+04')
  ) AS x(i, a, t);

  -- ─── Approvals (workflow instances a1/a2/a3) ─────────────────────────────
  SELECT id INTO wd FROM wf.workflow_definition WHERE code='CLIENT_APPROVAL' AND organization_id IS NULL;
  SELECT id INTO stg_lead    FROM wf.workflow_stage WHERE definition_id=wd AND code='LEAD_REQUESTED';
  SELECT id INTO stg_changes FROM wf.workflow_stage WHERE definition_id=wd AND code='CHANGES_REQUESTED';
  SELECT id INTO stg_client  FROM wf.workflow_stage WHERE definition_id=wd AND code='SENT_TO_CLIENT';

  INSERT INTO wf.workflow_instance (organization_id, code, definition_id, current_stage_id, title,
                                    project_id, milestone_id, deliverable_id, client_account_id, opened_at)
    VALUES (v_org, 'APR-00001', wd, stg_lead, 'CD Model Submission', p1, ms_cd, del_cd, c_marina,
            TIMESTAMPTZ '2025-07-08 10:00+04') RETURNING id INTO wi1;
  INSERT INTO wf.workflow_action (organization_id, instance_id, from_stage_id, to_stage_id, action_code, actor_party_id, note, occurred_at)
    VALUES (v_org, wi1, NULL, stg_lead, 'REQUEST_REVIEW', pa_pranav,
            'CD set is ready — please review before it goes to the client.', TIMESTAMPTZ '2025-07-08 10:00+04');

  INSERT INTO wf.workflow_instance (organization_id, code, definition_id, current_stage_id, title,
                                    project_id, deliverable_id, client_account_id, opened_at)
    VALUES (v_org, 'APR-00002', wd, stg_client, 'DD Coordination Model', p2, del_dd, c_emaar,
            TIMESTAMPTZ '2025-07-02 10:00+04') RETURNING id INTO wi2;
  INSERT INTO wf.workflow_action (organization_id, instance_id, from_stage_id, to_stage_id, action_code, actor_party_id, note, occurred_at) VALUES
    (v_org, wi2, NULL, stg_lead, 'REQUEST_REVIEW', pa_pranav,
     'DD federated model ready for client sign-off.', TIMESTAMPTZ '2025-07-02 10:00+04'),
    (v_org, wi2, stg_lead, stg_client, 'SEND_TO_CLIENT', pa_admin,
     'Reviewed internally — looks good, forwarded to client.', TIMESTAMPTZ '2025-07-05 10:00+04');

  INSERT INTO wf.workflow_instance (organization_id, code, definition_id, current_stage_id, title,
                                    project_id, deliverable_id, client_account_id, opened_at)
    VALUES (v_org, 'APR-00003', wd, stg_changes, 'Concept Massing Sign-off', p3, del_concept, c_habtoor,
            TIMESTAMPTZ '2025-07-01 10:00+04') RETURNING id INTO wi3;
  INSERT INTO wf.workflow_action (organization_id, instance_id, from_stage_id, to_stage_id, action_code, actor_party_id, note, occurred_at) VALUES
    (v_org, wi3, NULL, stg_lead, 'REQUEST_REVIEW', pa_pranav,
     'Concept massing for client sign-off.', TIMESTAMPTZ '2025-07-01 10:00+04'),
    (v_org, wi3, stg_lead, stg_changes, 'SUGGEST_UPDATES', pa_admin,
     'Add a shadow study and update the plot ratio before we send this to the client.', TIMESTAMPTZ '2025-07-03 10:00+04');

  -- ─── Leads (estimate requests) ───────────────────────────────────────────
  INSERT INTO crm.lead (organization_id, code, contact_name, company_name, contact_role, email, phone,
                        project_scale, brief, status_code)
    VALUES (v_org, 'REQ-09821', 'Khalid Al Mansoori', 'Al Mansoori Real Estate', 'Developer / Owner',
            'k.mansoori@alm-re.ae', '+971 50 234 5678', '520k sq ft',
            'Mixed-use tower in Business Bay. Currently at concept stage, need LOD 300 models ready for DD by Q3 2026.',
            'NEW') RETURNING id INTO l1;
  INSERT INTO crm.lead (organization_id, code, contact_name, company_name, contact_role, email, phone,
                        project_scale, brief, status_code)
    VALUES (v_org, 'REQ-08134', 'Sarah Mitchell', 'Construct Gulf LLC', 'General Contractor',
            's.mitchell@constructgulf.com', '+971 55 876 4321', '280k sq ft',
            'Residential complex in JVC. Structural and MEP coordination needed. Tender in 6 weeks — timeline is very tight.',
            'CONTACTED') RETURNING id INTO l2;
  INSERT INTO crm.lead (organization_id, code, contact_name, company_name, contact_role, email, phone,
                        project_scale, brief, status_code)
    VALUES (v_org, 'REQ-07452', 'Omar Farouq', 'Emarat Developments', 'Architect',
            'o.farouq@emarat-dev.com', '+971 52 109 8765', '180k sq ft',
            'Villa cluster in Dubai Hills. Need Arch model at LOD 300 and QTO for cost plan submission.',
            'ASSIGNED') RETURNING id INTO l3;

  INSERT INTO crm.lead_service (lead_id, service_id)
  SELECT x.lead, s.id
  FROM (VALUES
    (l1, '3D_MODELING'), (l1, 'CLASH_COORDINATION'), (l1, '4D_5D'),
    (l2, 'CLASH_COORDINATION'), (l2, 'SHOP_DRAWINGS'),
    (l3, '3D_MODELING'), (l3, 'QTO')
  ) AS x(lead, svc)
  JOIN crm.service_catalog s ON s.code = x.svc AND s.organization_id IS NULL;

  INSERT INTO crm.lead_assignment (organization_id, lead_id, kind, assigned_to_employee_id, note) VALUES
    (v_org, l3, 'LEAD_OWNER', e_pranav, 'Assigned by Admin from Estimate Requests queue.'),
    (v_org, l3, 'DELEGATE',   e_arjun,  'Review estimate and prepare scope response.');

  INSERT INTO crm.lead_status_history (organization_id, lead_id, from_status, to_status, changed_at) VALUES
    (v_org, l2, 'NEW', 'CONTACTED', TIMESTAMPTZ '2026-06-09 11:00+04'),
    (v_org, l3, 'NEW', 'CONTACTED', TIMESTAMPTZ '2026-06-06 11:00+04'),
    (v_org, l3, 'CONTACTED', 'ASSIGNED', TIMESTAMPTZ '2026-06-07 09:30+04');

  -- ─── Documents (client Docs tab) ─────────────────────────────────────────
  INSERT INTO dms.folder (organization_id, project_id, name) VALUES (v_org, p1, 'Published');

  DECLARE
    x record;
    n int := 0;
  BEGIN
    FOR x IN
      SELECT * FROM (VALUES
        ('Dubai Marina Tower — CD Set',                'DRAWINGS', 'v4.2',  DATE '2025-07-10'),
        ('Structural Coordination Model — Level 1–8',  'MODEL',    'Rev C', DATE '2025-07-08'),
        ('Clash Detection Report — Week 28',           'REPORT',   'v1.0',  DATE '2025-07-07'),
        ('MEP Federated Model',                        'MODEL',    'Rev B', DATE '2025-07-05'),
        ('RFI Log — July 2025',                        'REPORT',   'v1.0',  DATE '2025-07-01')
      ) AS v(title, dt, ver, pub)
    LOOP
      n := n + 1;
      INSERT INTO dms.file_blob (organization_id, sha256, byte_size, mime_type, storage_key, scan_status)
        VALUES (v_org, lpad(to_hex(n), 64, '0'), 1048576, 'application/octet-stream',
                'demo/' || n || '.bin', 'CLEAN') RETURNING id INTO b;
      INSERT INTO dms.document (organization_id, code, project_id,
                                folder_id, title, doc_type_id, state_code, client_visible)
        VALUES (v_org, 'DOC-' || lpad(n::text, 6, '0'), p1,
                (SELECT id FROM dms.folder WHERE project_id = p1 AND name = 'Published'),
                x.title,
                (SELECT id FROM core.lookup_value WHERE type_code='DOC_TYPE' AND code=x.dt AND organization_id IS NULL),
                'PUBLISHED', true) RETURNING id INTO d;
      INSERT INTO dms.document_version (organization_id, document_id, version_label, file_blob_id, published_at)
        VALUES (v_org, d, x.ver, b, x.pub::timestamptz) RETURNING id INTO dv;
      UPDATE dms.document SET current_version_id = dv WHERE id = d;
    END LOOP;
  END;

  -- ─── Prime code series past seeded values ────────────────────────────────
  INSERT INTO core.sequence_registry (organization_id, series, last_value) VALUES
    (v_org, 'RFI', 14), (v_org, 'ISS', 8), (v_org, 'REQ', 9821), (v_org, 'APR', 3),
    (v_org, 'TSK', 200), (v_org, 'WI', 1001), (v_org, 'PRJ', 3), (v_org, 'CLT', 3),
    (v_org, 'DOC', 5), (v_org, 'MTG', 0);

END $$;

COMMIT;
