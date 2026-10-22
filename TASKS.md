# Project Tasks

All implementation tasks are TODO. The order follows `docs/IMPLEMENTATION_PLAN.md`; complete and test each phase before advancing. Dependencies below are minimum prerequisites, not permission to bypass a phase gate. Each task includes its own relevant tests and documentation.

## Phase 1: Foundation

### T001 — Application scaffold and development checks
- Status: TODO
- Dependencies: None
- Expected result: Separate client and server TypeScript applications using the planned stack, root Prisma layout, safe environment examples, documented local commands, and working build/typecheck/test scripts. Establish a basic responsive UI shell and API health check.
- Completion check: From a clean dependency install, run the documented builds, typechecks, and smoke tests; verify the client shell and API health response. Record actual commands and results.

### T002 — Database model and backend infrastructure
- Status: TODO
- Dependencies: T001
- Expected result: Reviewed core entity relationships and tenant constraints; initial Prisma schema and PostgreSQL migrations; environment validation, consistent errors, request validation, and safe logging. Resolve authentication-related schema decisions needed by T003.
- Completion check: Apply migrations to an empty development/test database; validate the schema and test key foreign-key, uniqueness, tenant-relationship, and decimal-money constraints. Test invalid configuration and API error handling without leaking secrets.

### T003 — Authentication, role permissions, and tenant isolation
- Status: TODO
- Dependencies: T002
- Expected result: Documented authentication and tenant-membership decisions, secure sign-in/sign-out and lifecycle handling, password hashing, server-side permission enforcement, tenant context, and reusable audit logging. Define the role matrix and privileged administration boundaries.
- Completion check: Automated tests cover valid/invalid authentication, lifecycle expiry/revocation, denied role access, forged tenant/role input, cross-school access attempts, applicable cookie/CSRF defenses, and sensitive-action audit records.

### T004 — School setup and subscription administration
- Status: TODO
- Dependencies: T003
- Expected result: Authorized school provisioning/settings and subscription administration with documented lifecycle/access rules, without implying payment-provider or billing integration.
- Completion check: Test permitted and forbidden school/subscription actions, validation, lifecycle rules, audit records, and isolation between two schools. Verify the foundation phase checks together.

## Phase 2: School Operations

### T005 — Academic years, terms, classes, and subjects
- Status: TODO
- Dependencies: T004
- Expected result: Tenant-scoped academic configuration with validated relationships and configurable calendars.
- Completion check: Test CRUD, invalid and duplicate records, cross-school references, and role restrictions; verify the corresponding UI workflows.

### T006 — Admissions, students, guardians, and enrollment
- Status: TODO
- Dependencies: T005
- Expected result: Admission/profile workflows, guardian links, and enrollment into classes and academic years with privacy controls and duplicate prevention.
- Completion check: Test admission and enrollment workflows, duplicate constraints, guardian linkage, unauthorized access, and cross-school relationships; verify UI behavior.

### T007 — Teacher profiles and assignments
- Status: TODO
- Dependencies: T005, T006
- Expected result: Authorized teacher profile management and valid class/subject assignments tied to the academic structure.
- Completion check: Test assignment validation, duplicate/conflicting assignments as defined by requirements, role access, and tenant isolation; verify school-operations workflows together.

## Phase 3: Academic Management

### T008 — Attendance workflows
- Status: TODO
- Dependencies: T007
- Expected result: Teachers can record and review attendance for authorized classes, with duplicate prevention and auditable corrections.
- Completion check: Test valid attendance, duplicate records, invalid enrollment/date inputs, unauthorized teachers, cross-school requests, and correction history; verify UI workflows.

### T009 — Examinations, grading, and academic reports
- Status: TODO
- Dependencies: T008
- Expected result: Configurable grading, examinations and results, printable report cards, and filterable academic reports with export or print support.
- Completion check: Test grade boundaries and calculations, result validation, permissions, tenant isolation, report filters, and export/print output; verify the academic phase end to end.

## Phase 4: Financial Management

### T010 — Fee structures and invoices
- Status: TODO
- Dependencies: T009
- Expected result: Authorized fee configuration and invoice/item workflows using exact decimal amounts, consistent totals, transactions, and audit records.
- Completion check: Test fee/invoice validation, exact totals, transaction rollback, permissions, cross-school references, and audit history; verify invoice UI and printable output.

### T011 — Manual payments, balances, and financial reports
- Status: TODO
- Dependencies: T010
- Expected result: Manual payment recording with method, date, reference, amount, and recording user; accurate outstanding balances and filterable/exportable or printable financial reports. Define correction and overpayment rules before implementation.
- Completion check: Test partial/full payments, invalid or duplicate submissions, correction/overpayment rules, exact balances, rollback, audits, permissions, tenant isolation, and report output. Verify the finance phase end to end; label manual recording accurately.

## Phase 5: Portals and Communication

### T012 — Parent and student portals
- Status: TODO
- Dependencies: T011
- Expected result: Responsive portals showing only permitted academic and financial information for linked children or the authenticated student.
- Completion check: Test valid and revoked guardian links, sibling/student boundaries, role restrictions, cross-school attempts, and visible data; verify mobile portal workflows.

### T013 — Announcements and notifications
- Status: TODO
- Dependencies: T012
- Expected result: Authorized announcement publishing and notifications with explicitly agreed channels, audiences, delivery/read behavior, and privacy boundaries.
- Completion check: Test audience selection, authorized publishing, recipient isolation, and delivery/read behavior for chosen channels; verify UI behavior without claiming unsupported external delivery.

### T014 — Burmese/English localization and document usability
- Status: TODO
- Dependencies: T013
- Expected result: Complete Burmese/English interfaces, Myanmar Unicode and MMK formatting, printable school documents, responsive workflows, and agreed low-bandwidth behavior. Earlier tasks should preserve compatibility with these requirements.
- Completion check: Check both languages across core workflows, Unicode input/display, monetary/date formatting, report/document printing, mobile layouts, and agreed network conditions; record manual checks and automated results. Verify the portals/communication phase together.

## Phase 6: Production Readiness

### T015 — Security, regression coverage, and performance review
- Status: TODO
- Dependencies: T014
- Expected result: Full regression and multi-tenant security coverage, reviewed privacy/authorization behavior, and performance improvements against agreed criteria. Resolve identified release-blocking defects.
- Completion check: Run builds, typechecks, full test suite, multi-school authorization tests, and documented security/performance checks. Record evidence and unresolved issues; do not mark DONE with release blockers.

### T016 — Deployment, backup recovery, and operational handoff
- Status: TODO
- Dependencies: T015
- Expected result: Documented deployment configuration, migrations, monitoring, backup and restore procedures, operational guidance, and agreed recovery objectives. Do not deploy without explicit authorization.
- Completion check: Verify a non-production deployment procedure, migration process, monitoring/health checks, and backup restore exercise in an approved environment; record outcomes and any external access blockers. Review MVP acceptance criteria and operational documentation.
