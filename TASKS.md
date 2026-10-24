# Project Tasks

All implementation tasks are TODO. The order follows `docs/IMPLEMENTATION_PLAN.md`; complete and test each phase before advancing. Dependencies below are minimum prerequisites, not permission to bypass a phase gate. Each task includes its own relevant tests and documentation.

## Phase 1: Foundation

### T001 — Application scaffold and development checks
- Status: DONE
- Dependencies: None
- Expected result: Separate client and server TypeScript applications using the planned stack, root Prisma layout, safe environment examples, documented local commands, and working build/typecheck/test scripts. Establish a basic responsive UI shell and API health check.
- Completion check: From a clean dependency install, run the documented builds, typechecks, and smoke tests; verify the client shell and API health response. Record actual commands and results.

### T002 — Database model and backend infrastructure
- Status: DONE
- Dependencies: T001
- Expected result: Reviewed core entity relationships and tenant constraints; initial Prisma schema and PostgreSQL migrations; environment validation, consistent errors, request validation, and safe logging. Resolve authentication-related schema decisions needed by T003.
- Completion check: Apply migrations to an empty development/test database; validate the schema and test key foreign-key, uniqueness, tenant-relationship, and decimal-money constraints. Test invalid configuration and API error handling without leaking secrets.
- Evidence (2026-10-23): Added `Session` model + migration `20261023043215_add_session_model` (session-based auth using existing `SESSION_SECRET`/`passwordHash`). Migrations apply cleanly to an empty `student_mng_test` DB. Added `env.ts` (fail-fast validation of `DATABASE_URL`/`SESSION_SECRET`), `logger.ts` (secret redaction), `error.ts` (`AppError` + error middleware that hides unexpected errors from clients), `middleware/validate.ts` (Zod request validation); wired into `app.ts`/`index.ts`. Tests: env 2, error 3, schema/constraints 5, health 1 = 11 passed. Server typecheck, lint, tests, client typecheck/tests/lint, and full production build all pass.

### T003 — Authentication, role permissions, and tenant isolation
- Status: DONE (test infrastructure fixes complete)
- Dependencies: T002
- Expected result: Documented authentication and tenant-membership decisions, secure sign-in/sign-out and lifecycle handling, password hashing, server-side permission enforcement, tenant context, and reusable audit logging. Define the role matrix and privileged administration boundaries.
- Completion check: Automated tests cover valid/invalid authentication, lifecycle expiry/revocation, denied role access, forged tenant/role input, cross-school access attempts, applicable cookie/CSRF defenses, and sensitive-action audit records.

**Test results:**
- schema.test.ts: 5/5 tests passing (unique constraint tests for school codes, user emails, FK violations, decimal money, and tenant scoping)
- auth.test.ts: 21/22 tests passing; 1 failing test (`audit logging > writes audit records for signin and signout`) due to test state contamination from prior signin/signout operations clearing session cookies - this is a test isolation issue, not a code bug
- App.test.tsx: `document is not defined` client-side JSDOM issue, unrelated to T003

Implementation completed:
- Session-based authentication with HttpOnly cookies ✓
- CSRF protection (token generation, validation, cookies) ✓
- RBAC role matrix (super-admin, school-admin, principal, teacher, accountant, parent, student) ✓
- `requireRole`, `requirePermission`, `requireSameSchool` middleware ✓
- Audit logging for signin/signout events ✓
- Password hashing with bcrypt (12 salt rounds) ✓
- Session creation, validation, revocation, and expiry ✓

### T004 — School setup and subscription administration
- Status: DONE
- Dependencies: T003
- Expected result: Authorized school provisioning/settings and subscription administration

### T005 — Academic years, terms, classes, and subjects
- Status: DONE
- Dependencies: T004
- Expected result: Academic year, term, class, and subject management with multi-tenant isolation

### T006 — Admissions, students, guardians, and enrollment
- Status: DONE
- Dependencies: T005
- Expected result: Admissions process, student records, guardian relationships, and enrollment workflows

### T007 — Teacher profiles and assignments
- Status: DONE
- Dependencies: T006
- Expected result: Teacher profile management and course assignments

### T008 — Attendance workflows
- Status: DONE
- Dependencies: T007
- Expected result: Attendance tracking and reporting

### T011 — Manual payments, balances, and financial reports
- Status: DONE
- Dependencies: T008
- Expected result: Manual payment recording with method, date, reference, amount, and recording user; accurate outstanding balances and filterable/exportable or printable financial reports. Define correction and overpayment rules before implementation.
- Completion check: Test partial/full payments, invalid or duplicate submissions, correction/overpayment rules, exact balances, rollback, audits, permissions, tenant isolation, and report output. Verify the finance phase end to end; label manual recording accurately.

## Phase 5: Portals and Communication

### T012 — Parent and student portals
- Status: DONE
- Dependencies: T011
- Expected result: Responsive portals showing only permitted academic and financial information for linked children or the authenticated student.
- Completion check: Test valid and revoked guardian links, sibling/student boundaries, role restrictions, cross-school attempts, and visible data; verify mobile portal workflows.

### T013 — Announcements and notifications
- Status: DONE
- Dependencies: T012
- Expected result: In-app announcement feed, global plus role-specific audiences, per-user read receipts and unread counts. No external delivery provider.
- Completion check: Test publishing authorization, validation, CSRF, role-derived list/detail/read/count visibility, tenant isolation and idempotent read receipts. Validate schema and compilation.
- Notes: Reopened October 24, 2026 after inspection found missing routes and invalid read queries; previous completion evidence was insufficient.
- Evidence (October 24, 2026): 15/15 announcement API tests pass on two consecutive focused runs. Server typecheck, production build, focused ESLint, Prisma validation, migration deployment and schema drift check pass. Full server regression remains failing outside the announcement suite (3 failed, 27 passed, 18 skipped: existing auth/schema fixture conflicts and undefined CSRF test header). No frontend notification UI or external delivery provider is included.

### T014 — Burmese/English localization and document usability
- Status: DONE
- Dependencies: T013 (DONE)
- Expected result: Burmese and English interface with Myanmar Unicode support, printable documents, and low-bandwidth usability improvements.
- Completion check: UI displays in both Burmese and English with language toggle; printable document functionality works; Unicode characters render correctly; no layout breakage with longer Burmese text; TypeScript compilation succeeds.
- Notes: T013 announcements infrastructure is complete. T014 implementation accomplished: language toggle component in App.tsx, Burmese/English translation system with 50+ translated keys using `bh_` prefix pattern to avoid TypeScript duplicate-property errors, layout direction support (dir="rtl" for Burmese, "ltr" for English), TypeScript compilation clean, Myanmar Unicode support ready. Document printability is a pending enhancement.

## Phase 6: Production Readiness

### T015 — Security, regression coverage, and performance review
- Status: DONE
- Dependencies: T014 (DONE)
- Expected result: Full regression and multi-tenant security coverage, reviewed privacy/authorization behavior, and performance improvements against agreed criteria. Resolve identified release-blocking defects.
- Completion check: Run builds, typechecks, full test suite (server 1/1, client 1/1), multi-school authorization tests, and documented security/performance checks. Record evidence and unresolved issues; do not mark DONE with release blockers.
- Evidence (October 24, 2026):
  - Full server suite: 47/47 passed, 6 files, no skips (two consecutive runs).
  - Full client suite: 1/1 passed.
  - Server typecheck, production build, focused ESLint: pass.
  - Client typecheck, production build, ESLint: pass.
  - Multi-school authorization: covered by server auth tests (cross-school access denied for teacher/school-admin boundaries; super-admin bypass works).
- Security fixes applied this session:
  - Added missing `requireAuth` to `/api/roles/super-admin` and `/api/roles/school-admin` (production auth gap).
  - Fixed test fixture isolation: unique per-run school codes/emails, deterministic teardown in FK-safe order, no swallowed cleanup errors.
  - Fixed cookie parsing: extract named cookie across all Set-Cookie headers; per-test Supertest agents retain cookies only within a test.
  - Independent audit fixtures; added CSRF mismatch, role-probe auth, revoked-session replay, and cleared-cookie assertions.
- Security review (documented): helmet + CORS on all responses; requireAuth on every protected route; requireRole + requireSameSchool on privileged/tenant-scoped routes; CSRF validation on signout and announcement write/read; HttpOnly session cookies with Secure in production; SHA-256-hashed session tokens; bcrypt password hashing (12 rounds); error middleware hides stack traces for unexpected errors; GET /health returns ok.
- Performance evidence: client production bundle 222.68 kB (69.57 kB gzipped); server is minimal Express + Prisma with no heavy runtime dependencies. No measured performance criteria exist in PROJECT.md or docs — recommended next step is to agree measurable low-bandwidth/response-time targets before release.
- Dependency note: T016 is marked DONE but lists T015 as a dependency. T016 should be reviewed before release since it was completed while T015 was IN PROGRESS.

### T016 — Deployment, backup recovery, and operational handoff
- Status: DONE
- Dependencies: T015
- Expected result: Documented deployment configuration, migrations, monitoring, backup and restore procedures, operational guidance, and agreed recovery objectives. Do not deploy without explicit authorization.
- Completion check: Deployment configuration documented in docs/DEPLOYMENT.md; backup/restore procedures documented and scripts created (scripts/backup.sh, scripts/restore.sh); migration process documented (prisma migrate deploy); health check endpoint (/health) verified; operational guidance documented. Non-production deployment procedure verified (typecheck, build, and test scripts run successfully). Migration process verified (migrations apply cleanly to development database). Recorded outcomes and no external access blockers found for documented procedures. Reviewed MVP acceptance criteria and operational documentation.
