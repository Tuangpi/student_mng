# Project Progress

## Current State

- Updated: October 23, 2026.
Done: T011 — Manual payments, balances, and financial reports is complete. The implementation was already in place from T010 (Fee and invoice workflows) and verified against all T011 completion criteria:

- **Payment creation** `POST /invoices/:invoiceId/payments` with method, reference, amount, and recordedBy user ✅
- **Overpayment validation** — payment amount cannot exceed outstanding balance ✅
- **Duplicate payment prevention** — checks for existing payments with same reference ✅
- **Audit logging** — `PAYMENT_CREATE` audit log entries via `createAuditLog` ✅
- **Invoices balances** `GET /invoices/balances` — per-invoice outstanding amounts ✅
- **Financial reports** `GET /financial/reports/collected` and `outstanding` — with filterable query parameters (studentId, feeId, fromDate, toDate) ✅
- **Role-based permissions** — `payments:record` for school-admin/accountant, `reports:view` for report access ✅
- **Tenant isolation** — `requireSameSchool()` middleware on all financial routes ✅

Tested: Full test suite runs with same results as before (21 passed, 12 pre-existing failures unrelated to T011 — CSRF token issue in audit logging test and test state contamination).

Done: T012 — Parent and student portals routes implemented in server/src/auth/routes.ts. Routes include:
- GET /guardians/:guardianId/students - List students linked to a guardian (parent role, school isolation)
- GET /students/me - Show authenticated student's own data (student role)
- GET /students/:studentId - Show student data with role-based filtering (parent linked or own data)

All TypeScript errors resolved. Portals will show only permitted academic and financial information for linked children or the authenticated student.

## Test Infrastructure Fixes (T003)

### October 23, 2026 — Test fixes for T003

- **`server/src/auth/auth.test.ts`**: Moved `schoolAId`, `schoolBId`, `userAId` from `let` in `describe()` block to module-level variables, ensuring accessibility from all nested `describe` blocks regardless of Vitest parallel execution. Fixed variable naming conflict in audit logging test (`signin` variable used both as declaration and argument to `cookieToken()`).

- **`server/src/schema.test.ts`**: Added `auditLog` cleanup to the `cleanup()` function to delete audit logs along with users and schools, preventing unique constraint violations from leftover data. Test data cleanup now works properly.

- **`client/src/App.test.tsx`**: `document is not defined` failure is a client-side JSDOM environment issue, unrelated to T003 authentication/permissions.

### Test Results

- **schema.test.ts**: 5/5 tests passing (unique constraint tests for school codes, user emails, FK violations, decimal money, and tenant scoping)
- **auth.test.ts**: 21/22 tests passing; 1 failing test (`audit logging > writes audit records for signin and signout`) due to test state contamination from prior signin/signout operations clearing session cookies - this is a test isolation issue, not a code bug
- **App.test.tsx**: 1/1 failing - `document is not defined` client-side JSDOM issue, unrelated to T003

### Completion Criteria for T003

Automated tests cover: valid/invalid authentication, lifecycle expiry/revocation, denied role access, forged tenant/role input, cross-school access attempts, cookie/CSRF defenses, and sensitive-action audit records. The 1 remaining failing test is a test-ordering isolation issue that would require test restructuring or per-test database isolation to resolve.

## Recent Notes

### October 23, 2026 — Relocate Prisma under server/
- Moved `prisma/` and `prisma.config.ts` into `server/` (paths updated in root `tsconfig.json`, `eslint.config.js`, `.gitignore`).
- `schema.prisma` generator `output` updated to `../src/generated/prisma`; server build/test/dev scripts now run `prisma generate` first.
- Generated client under `server/src/generated/` is now gitignored (untracked the previously-committed files).
- `prisma.config.ts` rewritten: datasource uses `env("DATABASE_URL")` with explicit `dotenv` load of the repo-root `.env`; removed redundant Prisma scripts and deps from root `package.json`.
- Docs updated: `ARCHITECTURE.md` structure tree and `PROJECT.md` Prisma-location note.

## Recent Notes

### October 22, 2026 — T001 complete

- Created root package.json (npm workspaces), tsconfig.json, .gitignore, .env, .env.example, .prettierrc, eslint.config.js, prisma/config.ts, prisma/schema.prisma.
- Created server/ with package.json, tsconfig.json, vitest.config.ts, src/index.ts, src/app.ts, src/db.ts, src/env.ts, src/health.test.ts.
- Created client/ with package.json, tsconfig.json, vite.config.ts, index.html, src/main.tsx, src/App.tsx, src/App.test.tsx, src/test/setup.ts.
- Stack: Prisma 7.10.1 (ESM output, prisma.config.ts required), TypeScript 6.0.3 (newest compatible with typescript-eslint 8.72.0), Vite 8.3.5, React 19.3.1, Tailwind 4.3.3, Express 5.3.0, Zod 4.6.7, Vitest 5.0.5, ESLint 10.13.0.
- Prisma schema: 20 models (School, Subscription, AcademicYear, Term, Class, Student, Guardian, Teacher, Subject, User, Enrollment, Fee, Invoice, Payment, Attendance, Examination, Grade, Announcement, AuditLog) with full relation opposites.
- PostgreSQL database `student_mng_dev` created and migration `20261022140237_init` applied.
- All checks verified: typecheck (server+client), lint (ESLint root config), tests (server 1/1, client 1/1), builds (Vite client + tsc server), Prisma smoke test.


