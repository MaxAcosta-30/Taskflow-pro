// =============================================================
//  lib/metrics.ts — Prometheus metrics (fuente única de verdad)
//  Importar desde aquí en API routes, workers y socket server.
//  NUNCA definir métricas en app/api/metrics/route.ts
// =============================================================

import { Counter, Histogram, Gauge, Registry, collectDefaultMetrics } from 'prom-client'

// Registro singleton — evita el error "metric already registered"
const globalForMetrics = globalThis as unknown as { metricsRegistry: Registry | undefined }

export const register = globalForMetrics.metricsRegistry ?? new Registry()

if (!globalForMetrics.metricsRegistry) {
  globalForMetrics.metricsRegistry = register
  // Recolectar métricas de Node.js (CPU, memoria, etc.) una sola vez
  collectDefaultMetrics({ register })
}

// ── HTTP ──────────────────────────────────────────────────────
export const httpRequestsTotal = new Counter({
  name: 'taskflow_http_requests_total',
  help: 'Total HTTP requests received',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [register],
})

export const httpRequestDuration = new Histogram({
  name: 'taskflow_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
})

// ── Queue / Workers ───────────────────────────────────────────
export const queueJobsTotal = new Counter({
  name: 'taskflow_queue_jobs_total',
  help: 'Total queue jobs processed',
  labelNames: ['queue', 'status'] as const,
  registers: [register],
})

export const queueJobDuration = new Histogram({
  name: 'taskflow_queue_job_duration_seconds',
  help: 'Queue job processing duration in seconds',
  labelNames: ['queue'] as const,
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [register],
})

// ── WebSockets ────────────────────────────────────────────────
export const activeWebSocketConnections = new Gauge({
  name: 'taskflow_websocket_connections_active',
  help: 'Number of active WebSocket connections',
  registers: [register],
})

// ── Automatizaciones ──────────────────────────────────────────
export const automationsTriggeredTotal = new Counter({
  name: 'taskflow_automations_triggered_total',
  help: 'Total automations triggered',
  labelNames: ['trigger_type', 'status'] as const,
  registers: [register],
})

// ── Notificaciones ─────────────────────────────────────────────
export const notificationsSentTotal = new Counter({
  name: 'taskflow_notifications_sent_total',
  help: 'Total notifications sent',
  labelNames: ['type'] as const,
  registers: [register],
})

// ── Usuarios ──────────────────────────────────────────────────
export const activeUsers = new Gauge({
  name: 'taskflow_active_users_total',
  help: 'Users active in the last 5 minutes',
  registers: [register],
})
