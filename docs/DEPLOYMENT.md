# Deployment Guide

## Prerequisites

- Node.js >= 24.0.0
- PostgreSQL database with `student_mng_dev` or `student_mng_prod` database
- npm or yarn

## Environment Setup

Copy `.env.example` to `.env` and set the following variables:

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB_NAME"
NODE_ENV=production
PORT=4000
CLIENT_URL=http://localhost:5173
SESSION_SECRET=your-32-plus-character-secret-key-here
```

## Production Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://admin:secret@db.internal:5432/student_mng_prod` |
| `NODE_ENV` | Set to `production` | `production` |
| `SESSION_SECRET` | Secret for session signing (32+ chars) | `rotate-this-often-production-secret-min-32-chars` |
| `PORT` | Server port | `4000` |
| `CLIENT_URL` | Frontend application URL | `https://schools.example.com` |

## Database Migrations

The project uses Prisma with versioned migrations. Migration files are located in `server/prisma/migrations/`.

### Running migrations in development

```bash
cd server
npm run prisma:migrate:dev
```

### Running migrations in production

```bash
cd server
npm run prisma:migrate:deploy
```

This command applies all pending migrations to the production database defined by `DATABASE_URL` in your `.env` file.

### Generating Prisma client

After schema changes, regenerate the Prisma client:

```bash
cd server
npm run prisma:generate
```

## Development Server

```bash
npm run dev
```

or separately:

```bash
# Server
cd server && npm run dev:server

# Client
cd client && npm run dev:client
```

## Production Build

```bash
npm run build
```

This runs `build:server` and `build:client`:
- `build:server`: `cd server && tsc --noEmit && tsc -p tsconfig.json`
- `build:client`: `cd client && vite build`

The server starts with: `node dist/src/index.js`

## Health Checks

The application provides a health check endpoint at `GET /health`:

```json
{
  "status": "ok",
  "timestamp": "2026-10-24T12:00:00.000Z"
}
```

Use this endpoint in load balancers or monitoring systems to verify the server is running.

## Backup Procedure

### Manual backup

```bash
# PostgreSQL dump using pg_dump
pg_dump -h localhost -U postgres -d student_mng_prod > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Automated backup script

A backup script is available at `scripts/backup.sh`. To use it:

```bash
chmod +x scripts/backup.sh
./scripts/backup.sh
```

The script performs the following:
1. Creates a compressed PostgreSQL dump
2. Names the file with timestamp: `student_mng_prod_YYYYMMDD_HHMMSS.sql.gz`
3. Stores backups in the `backups/` directory

## Restore Procedure

### From a backup file

```bash
psql -h localhost -U postgres -d student_mng_prod < backup_file.sql
```

### From a compressed backup

```bash
gunzip -c backup_file.sql.gz | psql -h localhost -U postgres -d student_mng_prod
```

## Operational Handoff

### Logs

- Application logs are written to stderr (structured format)
- In production, redirect logs to a centralized logging system (e.g., ELK, Papertrail)
- Audit logs are stored in the `audit_logs` table and can be queried via the API

### Monitoring

- Health check: `GET /health` returns `{"status":"ok",...}`
- Metrics can be scraped from the health endpoint
- Set up alerting on failed health checks

### Scale considerations

- The application uses a modular monolith architecture
- Each school is isolated via the `schoolId` field
- Database connection pooling is handled by Prisma with PostgreSQL
- For horizontal scaling, ensure session affinity or use a distributed session store

### Security notes

- Rotate `SESSION_SECRET` regularly in production
- Never commit `.env` files or raw credentials
- Use managed PostgreSQL with automated backups if possible
- Keep Prisma and all dependencies up to date

### Emergency procedures

1. **Database failure**: Restore from latest backup using the restore procedure above
2. **Application crash**: Restart with `npm run start` (or `node dist/src/index.js`)
3. **Compromised secrets**: Rotate `SESSION_SECRET`, revoke all sessions, and redeploy

## Rollback Procedure

If a deployment introduces issues:

1. Restore the database from the previous backup
2. Roll back Prisma migrations if needed:
   ```bash
   cd server
   npx prisma migrate rollback --name migration_name
   ```
3. Redeploy the previous version of the application

### Known limitations

- Backup state depends on PostgreSQL being accessible
- No point-in-time recovery without a separate WAL archival setup
- Migration rollback is supported for the last applied migration only