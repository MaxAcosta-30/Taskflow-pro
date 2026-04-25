#!/bin/sh
# =============================================================
#  TaskFlow Pro — Entrypoint
#  Ejecuta migraciones antes de iniciar la app
# =============================================================

set -e

echo " Ejecutando migraciones de base de datos..."
npx prisma migrate deploy

echo " Migraciones completadas"
echo " Iniciando TaskFlow Pro..."

exec node server.js
