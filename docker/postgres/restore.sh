#!/bin/bash
# =============================================================
#  docker/postgres/restore.sh — Restaurar backup de PostgreSQL
# =============================================================

set -euo pipefail

BACKUP_FILE="${1:-}"

if [ -z "${BACKUP_FILE}" ]; then
  echo "Usage: $0 <backup_file.sql.gz>"
  echo ""
  echo "Available backups:"
  ls -lh /backups/taskflow_*.sql.gz 2>/dev/null || echo "No backups found in /backups/"
  exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

echo "[$(date -Iseconds)] WARNING: This will OVERWRITE the current database!"
echo "Database: ${POSTGRES_DB:-taskflow_db}"
echo "Backup: ${BACKUP_FILE}"
echo ""
read -rp "Type 'yes' to continue: " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

echo "[$(date -Iseconds)] Starting restore from ${BACKUP_FILE}..."

PGPASSWORD="${POSTGRES_PASSWORD}" gunzip -c "${BACKUP_FILE}" | psql \
  --host="${POSTGRES_HOST:-postgres}" \
  --port="${POSTGRES_PORT:-5432}" \
  --username="${POSTGRES_USER:-taskflow}" \
  --dbname="${POSTGRES_DB:-taskflow_db}"

echo "[$(date -Iseconds)] Restore complete."
