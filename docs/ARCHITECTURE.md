# Architecture

Use a modular monolith. Keep the frontend and backend separate, with clear module boundaries.

## Structure

```text
student-management/
├── client/
│   └── src/
│       ├── components/
│       ├── features/
│       ├── layouts/
│       ├── pages/
│       ├── lib/
│       └── types/
├── server/
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── modules/
│       ├── middleware/
│       ├── common/
│       ├── config/
│       └── app.ts
├── docs/
└── README.md
```

## Backend Modules
- auth
- schools
- users
- students
- guardians
- academics
- attendance
- examinations
- fees
- reports
- notifications
- subscriptions
- audit-logs

Each module should separate routes, controllers, services, validation schemas, and data access where useful.

## Rules
- Controllers handle HTTP requests; services contain business logic.
- Validate all incoming data.
- Enforce school-level data isolation on the server.
- Use database transactions for related financial and academic changes.
- Store secrets in environment variables.
- Use migrations for database changes.
- Keep API responses and error formats consistent.
- Avoid microservices for the MVP.
