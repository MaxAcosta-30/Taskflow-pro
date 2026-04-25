/* eslint-disable @typescript-eslint/require-await */
// =============================================================
//  workers/index.ts — BullMQ Worker Entry Point
//  Proceso separado que consume las colas de Redis
// =============================================================

import { Worker } from 'bullmq'

import { workerLogger } from '@/lib/logger'
import { QUEUE_NAMES } from '@/lib/queue'
import { redis } from '@/lib/redis'

// Los processors importados de la Fase 4
import { automationProcessor } from './processors/automation'
import { notificationProcessor } from './processors/notification'
import { cleanupProcessor } from './processors/cleanup'

workerLogger.info(' TaskFlow Worker iniciando...')

// ── Worker de Automatizaciones ────────────────────────────────
const automationsWorker = new Worker(
  QUEUE_NAMES.AUTOMATIONS,
  async (job) => {
    workerLogger.info({ jobId: job.id, name: job.name }, 'Processing automation job')
    await automationProcessor(job)
  },
  {
    connection: redis,
    concurrency: 5,
  },
)

// ── Worker de Notificaciones ──────────────────────────────────
const notificationsWorker = new Worker(
  QUEUE_NAMES.NOTIFICATIONS,
  async (job) => {
    workerLogger.info({ jobId: job.id, name: job.name }, 'Processing notification job')
    await notificationProcessor(job)
  },
  {
    connection: redis,
    concurrency: 10,
  },
)

// ── Worker de Limpieza ────────────────────────────────────────
const cleanupWorker = new Worker(
  QUEUE_NAMES.CLEANUP,
  async (job) => {
    workerLogger.info({ jobId: job.id }, 'Running cleanup job')
    await cleanupProcessor(job)
  },
  {
    connection: redis,
    concurrency: 1,
  },
)

// ── Event Listeners ───────────────────────────────────────────
const workers = [automationsWorker, notificationsWorker, cleanupWorker]

workers.forEach((worker) => {
  worker.on('completed', (job) => {
    workerLogger.info({ jobId: job.id, queue: worker.name }, 'Job completed ')
  })

  worker.on('failed', (job, err) => {
    workerLogger.error(
      { jobId: job?.id, queue: worker.name, error: err.message },
      'Job failed ',
    )
  })

  worker.on('error', (err) => {
    workerLogger.error({ queue: worker.name, error: err.message }, 'Worker error')
  })
})

workerLogger.info(' Workers activos y escuchando colas')

// ── Graceful Shutdown ─────────────────────────────────────────
async function shutdown() {
  workerLogger.info('Cerrando workers...')
  await Promise.all(workers.map((w) => w.close()))
  process.exit(0)
}

process.on('SIGTERM', () => void shutdown())
process.on('SIGINT',  () => void shutdown())
