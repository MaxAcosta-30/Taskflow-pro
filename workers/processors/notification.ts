import type { Job } from 'bullmq'
import type { NotificationType } from '@prisma/client'

import { db } from '@/lib/db'
import { workerLogger } from '@/lib/logger'
// import { emitToUser } from '@/lib/socket' // TODO: Emit across instances using Redis PubSub

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
  // En una arquitectura multi-instancia, esto debe viajar por Redis Pub/Sub
  // emitToUser(userId, 'notification:new', notification)

  return notification
}
