#!/usr/bin/env bash
#
# Restore script for student_mng PostgreSQL database
#
# Usage: ./scripts/restore.sh <backup_file>
#
# This script restores a PostgreSQL database from a compressed or uncompressed dump.
#
# Arguments:
#   backup_file - Path to the backup file ( .sql or .sql.gz )
#

set -euo pipefail

# Configuration
PROJECT_DIR="/home/tuangpi/Documents/My notes/student_mng"
ENV_FILE="${PROJECT_DIR}/.env"

# Read DATABASE_URL from .env if it exists, otherwise use default
if [ -f "$ENV_FILE" ]; then
    DB_URL=$(grep -E "^DATABASE_URL=" "$ENV_FILE" | cut -d'=' -f2)
else
    DB_URL="postgresql://postgres@localhost:5432/student_mng_dev"
fi

# Extract database name from DATABASE_URL (take everything after the last /)
DB_NAME=$(echo "$DB_URL" | rev | cut -d'/' -f1 | rev)

# Extract username from DATABASE_URL
# Format: postgresql://user:password@host:port/dbname
DB_USER=$(echo "$DB_URL" | sed -E 's|postgresql://([^:]+):.*|\1|')

# Validate arguments
if [ $# -lt 1 ]; then
    echo "Usage: $0 <backup_file>"
    echo "  backup_file - Path to the backup file (.sql or .sql.gz)"
    exit 1
fi

BACKUP_FILE="$1"

# Validate backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

echo "Starting restore of ${DB_NAME} from ${BACKUP_FILE}..."

# Determine restore method based on file extension
case "$BACKUP_FILE" in
    *.sql.gz)
        echo "Decompressing .sql.gz file..."
        gunzip -c "$BACKUP_FILE" | psql -h localhost -U "${DB_USER}" "${DB_NAME}"
        ;;
    *.sql)
        echo "Using uncompressed .sql file..."
        cat "$BACKUP_FILE" | psql -h localhost -U "${DB_USER}" "${DB_NAME}"
    ;;
    *)
        echo "❌ Unsupported file format: ${BACKUP_FILE} (expected .sql or .sql.gz)"
        exit 1
        ;;
esac

# Verify the restore
if [ $? -eq 0 ]; then
    echo "✅ Restore completed successfully"
else
    echo "❌ Restore failed"
    exit 1
fi
