import { Counter, Histogram, Registry } from 'prom-client';

const register = new Registry();

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

export const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

export const websocketConnectionsActive = new Counter({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections',
  registers: [register],
});

export const automationJobsProcessed = new Counter({
  name: 'automation_jobs_processed_total',
  help: 'Total number of automation jobs processed',
  labelNames: ['status', 'trigger_type'],
  registers: [register],
});

export const notificationsSentTotal = new Counter({
  name: 'notifications_sent_total',
  help: 'Total number of notifications sent',
  labelNames: ['type'],
  registers: [register],
});

export const tasksCreatedTotal = new Counter({
  name: 'tasks_created_total',
  help: 'Total number of tasks created',
  registers: [register],
});

export { register };
