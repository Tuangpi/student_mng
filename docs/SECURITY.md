# Security Requirements

- Hash passwords with Argon2id or bcrypt.
- Enforce server-side authentication and authorization.
- Never trust school IDs or roles supplied by the client.
- Verify tenant ownership for every school-owned resource.
- Validate and sanitize incoming data.
- Apply rate limiting and secure HTTP headers.
- Use secure, HTTP-only cookies when using cookie-based sessions.
- Protect against CSRF where applicable.
- Keep secrets and production credentials out of source control.
- Restrict access to student, guardian, and financial information.
- Log sensitive administrative and financial changes.
- Back up the database and document recovery procedures.
- Never store raw passwords or payment credentials.
- Test for cross-school data access vulnerabilities.

Security checks must be enforced by the backend, not just the UI.
