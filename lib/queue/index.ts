// =============================================================
//  lib/queue/index.ts — BullMQ Queues
//  Define todas las colas de la aplicación
// =============================================================

import { Queue, QueueEvents } from 'bullmq'

import { redis } from '@/lib/redis'
import type { AutomationJobData, NotificationJobData } from '@/types'


// ── Conexión compartida para BullMQ ──────────────────────────
const connection = redis

// ── Nombres de colas ──────────────────────────────────────────
export const QUEUE_NAMES = {
  AUTOMATIONS:   'automations',
  NOTIFICATIONS: 'notifications',
  EMAILS:        'emails',
  CLEANUP:       'cleanup',
} as const

// ── Definición de colas ───────────────────────────────────────
export const automationsQueue = new Queue<AutomationJobData>(
  QUEUE_NAMES.AUTOMATIONS,
  {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { count: 100 },
      removeOnFail:    { count: 500 },
    },
  },
)

export const notificationsQueue = new Queue<NotificationJobData>(
  QUEUE_NAMES.NOTIFICATIONS,
  {
    connection,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: 'fixed', delay: 2000 },
      removeOnComplete: { count: 200 },
      removeOnFail:    { count: 100 },
    },
  },
)

export const cleanupQueue = new Queue(
  QUEUE_NAMES.CLEANUP,
  {
    connection,
    defaultJobOptions: {
      attempts: 1,
      removeOnComplete: true,
      removeOnFail: { count: 50 },
    },
  },
)

// ── Queue Events (para monitoring) ───────────────────────────
export const automationQueueEvents = new QueueEvents(
  QUEUE_NAMES.AUTOMATIONS,
  { connection },
)

// ── Helper: agregar job de automatización ────────────────────
export async function triggerAutomation(data: AutomationJobData) {
  return automationsQueue.add('run-automation', data, {
    jobId: `automation-${data.automationId}-${Date.now()}`,
  })
}

// ── Helper: enviar notificación ───────────────────────────────
export async function queueNotification(data: NotificationJobData) {
  return notificationsQueue.add('send-notification', data)
}

// ── Helper: job de limpieza programada ───────────────────────
export async function scheduleCleanup() {
  // Ejecutar cada día a las 2am
  return cleanupQueue.add(
    'daily-cleanup',
    {},
    {
      repeat: { pattern: '0 2 * * *' },
      jobId: 'daily-cleanup',
    },
  )
}
