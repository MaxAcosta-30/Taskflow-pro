#!/bin/bash
# =============================================================
#  docker/postgres/backup.sh — Backup automatizado de PostgreSQL
# =============================================================

set -euo pipefail

BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/taskflow_${TIMESTAMP}.sql.gz"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

echo "[$(date -Iseconds)] Starting PostgreSQL backup..."

# Crear directorio si no existe
mkdir -p "${BACKUP_DIR}"

# Ejecutar pg_dump y comprimir
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
  --host="${POSTGRES_HOST:-postgres}" \
  --port="${POSTGRES_PORT:-5432}" \
  --username="${POSTGRES_USER:-taskflow}" \
  --dbname="${POSTGRES_DB:-taskflow_db}" \
  --format=plain \
  --no-owner \
  --no-acl \
  | gzip > "${BACKUP_FILE}"

BACKUP_SIZE=$(du -sh "${BACKUP_FILE}" | cut -f1)
echo "[$(date -Iseconds)] Backup created: ${BACKUP_FILE} (${BACKUP_SIZE})"

# Eliminar backups antiguos
DELETED_COUNT=$(find "${BACKUP_DIR}" -name "taskflow_*.sql.gz" -mtime "+${RETENTION_DAYS}" | wc -l)
find "${BACKUP_DIR}" -name "taskflow_*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete

if [ "${DELETED_COUNT}" -gt "0" ]; then
  echo "[$(date -Iseconds)] Deleted ${DELETED_COUNT} old backup(s) older than ${RETENTION_DAYS} days"
fi

CURRENT_COUNT=$(find "${BACKUP_DIR}" -name "taskflow_*.sql.gz" | wc -l)
echo "[$(date -Iseconds)] Backup complete. Total backups retained: ${CURRENT_COUNT}"
