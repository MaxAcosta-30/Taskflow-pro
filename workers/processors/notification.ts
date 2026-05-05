import type { NotificationType } from '@prisma/client'
import type { Job } from 'bullmq'
import webpush from 'web-push'

import { db } from '@/lib/db'
import { workerLogger } from '@/lib/logger'
import { notificationsSentTotal } from '@/lib/metrics'
import { publishToUser } from '@/lib/socket/publisher'

// Configurar VAPID (Debe venir de variables de entorno)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@taskflow.pro',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  )
}

export async function notificationProcessor(job: Job) {
  const { userId, type, title, body, data } = job.data as {
    userId: string
    type: NotificationType
    title: string
    body: string
    data?: any
  }

  workerLogger.debug({ jobId: job.id, userId, type }, 'Processing notification')

  try {
    // 1. Obtener preferencias del usuario
    const settings = await db.notificationSetting.findUnique({
      where: { userId_type: { userId, type } },
    })

    // 2. In-App Notification (DB + WebSockets)
    // Si no hay settings configurados, asumimos que In-App está activo por defecto
    if (!settings || settings.inApp) {
      const notification = await db.notification.create({
        data: {
          userId,
          type,
          title,
          body,
          data: data ? data : undefined,
        },
      })
      await publishToUser(userId, 'notification:new', { notification: notification as never })
    }

    // 3. Web Push Notification
    if (settings?.push !== false) {
      const subscriptions = await db.pushSubscription.findMany({
        where: { userId },
      })

      const pushPayload = JSON.stringify({
        title,
        body,
        data: { ...data, type },
        icon: '/icons/icon-192x192.png',
      })

      const pushPromises = subscriptions.map((sub) =>
        webpush
          .sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            pushPayload,
          )
          .catch((err) => {
            if (err.statusCode === 410 || err.statusCode === 404) {
              return db.pushSubscription.delete({ where: { id: sub.id } })
            }
            workerLogger.error({ subId: sub.id, error: err.message }, 'Push delivery failed')
          }),
      )

      await Promise.all(pushPromises)
    }

    // 4. Métrica
    notificationsSentTotal.inc({ type })

    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    workerLogger.error({ userId, error: message }, 'Notification processor failed')
    throw error
  }
}
