# Student Management System

## Goal and Scope

Build a Myanmar-first, multi-tenant SaaS for private schools. Support school administration, academic operations, finances, and parent/student communication with strict school-level data isolation.

The MVP includes authentication and permissions; schools and subscriptions; academic setup; admissions, students, guardians, and teachers; attendance; examinations and report cards; fees, invoices, and manual payments; portals; announcements and notifications; and academic/financial reports.

## Source Documents

Preserve the detailed requirements and design documents in `docs/`:
- `docs/PROJECT_GOAL.md`: product goals.
- `docs/REQUIREMENTS.md`: roles, MVP features, and acceptance criteria.
- `docs/TECH_STACK.md`: planned technology stack.
- `docs/ARCHITECTURE.md`: module boundaries and repository layout.
- `docs/DATABASE.md`: entities and data constraints.
- `docs/SECURITY.md`: security requirements.
- `docs/IMPLEMENTATION_PLAN.md`: phase ordering.

This file captures project-level decisions. `TASKS.md` is the authoritative task-status record; `PROGRESS.md` holds current state and handoff notes. Update the relevant source documents when requirements change.

## Planned Stack and Architecture

- Frontend: React, Vite, TypeScript, shadcn/ui, Tailwind CSS.
- Backend: Node.js, Express, TypeScript, REST API, Zod validation.
- Database: PostgreSQL with Prisma and versioned migrations.
- Testing: Vitest and Supertest.
- Architecture: modular monolith; separate `client/` and `server/` directories in one repository, with Prisma schema and migrations under `server/prisma/`.
- Separate HTTP handling, business logic, validation, and data access where useful.

These technologies are planned, not installed or verified. Select stable, compatible package versions during implementation; no versions are currently pinned.

## Requirements and Constraints

- Roles: SaaS Super Admin, School Admin, Principal, Teacher, Accountant, Parent, Student.
- Enforce authentication, role permissions, and tenant ownership on the server. Never trust client-supplied roles or school IDs.
- Parents may access only permitted information about linked children; students may access only their own permitted information.
- Support Burmese and English, Myanmar Unicode, MMK, configurable academic years and grading, printable documents, responsive layouts, and low-bandwidth usability.
- MVP payments are manual records for cash, bank transfers, KBZPay, WavePay, and AYA Pay. Recording a method is not a payment-provider integration.
- Use precise decimal monetary values, foreign keys, appropriate uniqueness constraints, indexes, timestamps, and transactions for related changes.
- Audit sensitive administrative and financial changes. Keep secrets, raw passwords, and payment credentials out of source control.
- Include relevant automated tests in each feature task. The production-readiness task supplements those tests rather than postponing them.
- Complete and verify each phase before starting the next, following `docs/IMPLEMENTATION_PLAN.md`.

## Verified State

As of October 22, 2026, repository inspection found a minimal README and seven design documents in `docs/`. No application source, package manifests, database schema, migrations, or test configuration exists. No runtime features are implemented or verified.

## Decisions Still Needed

Resolve decisions in the task that first depends on them, before implementing affected behavior:
- Session versus JWT authentication, session/token lifecycle, and password-hashing choice.
- Role/permission matrix, tenant membership model, and privileged cross-school administration rules.
- Subscription lifecycle and access rules; do not assume automated subscription billing.
- Detailed entity relationships, academic rules, and grading rules.
- Notification channels and delivery requirements; do not assume an external provider.
- Deployment target, backup/recovery objectives, and measurable low-bandwidth/performance criteria.

## Working Agreement

Resume an `IN PROGRESS` task first; otherwise select the first unblocked `TODO` task. Mark it `IN PROGRESS` before implementation. Work on one tracked deliverable and its required dependencies, verify it, update `TASKS.md` and `PROGRESS.md`, then stop. Mark `DONE` only with evidence satisfying its completion check. Record blockers explicitly. Do not commit, push, or deploy without a request.
