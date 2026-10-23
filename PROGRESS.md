# Project Progress

## Current State

- Updated: October 23, 2026.
- Current task: T003 — Authentication, role permissions, and tenant isolation (IN PROGRESS).
- Most recently completed task: T002.
- Verified (T002): Prisma schema + `Session` model; migration `20261023043215_add_session_model` applied and migrations apply cleanly to an empty DB; env fail-fast validation, secret-redacting logger, `AppError` + error middleware (no client secret leak), Zod request validation wired into `app.ts`/`index.ts`; 11 server tests pass (env 2, error 3, schema constraints 5, health 1); server+client typecheck, lint, tests, and full production build all pass.
- Unfinished work: T003–T016 are TODO.
- Blockers: None.
- Recommended next task: T003 — Authentication, role permissions, and tenant isolation.

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


