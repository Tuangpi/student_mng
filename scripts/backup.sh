#!/usr/bin/env bash
#
# Backup script for student_mng PostgreSQL database
#
# Usage: ./scripts/backup.sh
#

set -euo pipefail

PROJECT_DIR="/home/tuangpi/Documents/My notes/student_mng"
BACKUP_DIR="${PROJECT_DIR}/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Read DATABASE_URL from .env and strip quotes
DB_LINE=$(grep '^DATABASE_URL=' "${PROJECT_DIR}/.env" | head -1)
DB_URL=$(echo "$DB_LINE" | cut -d'=' -f2 | sed 's|^"\|"$||g')

# Extract database name (after the last /)
DB_NAME=$(echo "$DB_URL" | rev | cut -d'/' -f1 | rev)

# Extract username (between postgresql:// and the next : or @)
DB_USER=$(echo "$DB_URL" | sed -E 's|postgresql://([^@/:]+).*)|\1|')

BACKUP_FILE="${BACKUP_DIR}/student_mng_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "Starting backup of ${DB_NAME}..."
echo "Backup file: ${BACKUP_FILE}"

pg_dump -h localhost -U "${DB_USER}" "${DB_NAME}" | gzip > "${BACKUP_FILE}"

if [ -f "${BACKUP_FILE}" ] && [ -s "${BACKUP_FILE}" ]; then
    echo "Backup completed: $(ls -lh "${BACKUP_FILE}" | awk '{print $5}') at ${BACKUP_FILE}"
else
    echo "Backup failed"
    rm -f "${BACKUP_FILE}"
    exit 1
fi

echo "Backup finished."
