// =============================================================
//  app/api/metrics/route.ts — Prometheus Metrics Endpoint
// =============================================================

import { NextRequest, NextResponse } from 'next/server'
import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client'

// Inicializar métricas por defecto (CPU, memoria, etc.)
collectDefaultMetrics({ register })

// ── Métricas custom ───────────────────────────────────────────

export const httpRequestsTotal = new Counter({
  name: 'taskflow_http_requests_total',
  help: 'Total de requests HTTP',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
})

export const httpRequestDuration = new Histogram({
  name: 'taskflow_http_request_duration_seconds',
  help: 'Duración de requests HTTP en segundos',
  labelNames: ['method', 'route'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
})

export const activeWebSocketConnections = new Gauge({
  name: 'taskflow_websocket_connections_active',
  help: 'Conexiones WebSocket activas',
  registers: [register],
})

export const queueJobsTotal = new Counter({
  name: 'taskflow_queue_jobs_total',
  help: 'Total de jobs procesados',
  labelNames: ['queue', 'status'],
  registers: [register],
})

export const queueJobDuration = new Histogram({
  name: 'taskflow_queue_job_duration_seconds',
  help: 'Duración de procesamiento de jobs',
  labelNames: ['queue'],
  registers: [register],
})

export const automationsTriggeredTotal = new Counter({
  name: 'taskflow_automations_triggered_total',
  help: 'Total de automatizaciones ejecutadas',
  labelNames: ['trigger_type', 'status'],
  registers: [register],
})

export const activeUsers = new Gauge({
  name: 'taskflow_active_users_total',
  help: 'Usuarios activos en los últimos 5 minutos',
  registers: [register],
})

// ── Endpoint GET /api/metrics ─────────────────────────────────
export async function GET(request: NextRequest) {
  // Proteger con secret en producción
  const secret = request.headers.get('x-metrics-secret')
  if (
    process.env.NODE_ENV === 'production' &&
    secret !== process.env.METRICS_SECRET
  ) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const metrics = await register.metrics()

  return new NextResponse(metrics, {
    headers: { 'Content-Type': register.contentType },
  })
}
