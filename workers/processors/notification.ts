import type { Job } from 'bullmq'
import type { NotificationType } from '@prisma/client'

import { db } from '@/lib/db'
import { workerLogger } from '@/lib/logger'
import { emitToUserFromWorker } from '@/lib/socket/emitter'
import { notificationsSentTotal } from '@/lib/metrics'

export async function notificationProcessor(job: Job) {
  const { userId, type, title, body, data } = job.data as {
    userId: string
    type: NotificationType
    title: string
    body: string
    data?: any
  }

  workerLogger.debug({ jobId: job.id, userId, type }, 'Processing notification')

  // Guardar en Base de Datos
  const notification = await db.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      data: data ? data : undefined
    }
  })

  workerLogger.info({ notificationId: notification.id }, 'Notification saved to DB')

  // Emitir por webSockets al cliente en tiempo real
  emitToUserFromWorker(userId, 'notification:new', { notification: notification as any })

  // Incrementar métrica
  notificationsSentTotal.inc({ type })

  return notification
}
