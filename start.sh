#!/bin/bash

echo "🚀 Iniciando servicios con Docker..."
docker compose --profile dev up -d

echo "📦 Ejecutando migraciones de la base de datos..."
npm run db:migrate

echo "🌱 Sembrando la base de datos..."
npm run db:seed

echo "🌐 Iniciando el frontend y el worker..."
# Iniciamos el worker en segundo plano
npm run worker:dev &
WORKER_PID=$!

# Iniciamos el frontend
npm run dev

# Si el frontend se detiene, también detenemos el worker
kill $WORKER_PID
