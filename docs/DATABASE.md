# Database Design

Use PostgreSQL with Prisma.

## Core Entities
- School
- Subscription
- User
- Role / Permission
- AcademicYear
- Term
- Class
- Subject
- TeacherAssignment
- Student
- Guardian
- StudentGuardian
- Enrollment
- Attendance
- Examination
- ExamResult
- FeeStructure
- Invoice
- InvoiceItem
- Payment
- Announcement
- Notification
- AuditLog

## Requirements
- Use UUID primary keys where appropriate.
- Add `schoolId` to school-owned records.
- Enforce tenant isolation in every relevant query and mutation.
- Add foreign keys, unique constraints, indexes, and timestamps.
- Prevent duplicate attendance and enrollment records where appropriate.
- Store monetary values using precise decimal types, not floating-point numbers.
- Record payment method, amount, date, reference, and recording user.
- Keep audit records for sensitive changes.
- Use migrations for all schema changes.

Finalize relationships and constraints before implementing dependent modules.
