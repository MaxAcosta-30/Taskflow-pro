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

export interface NotificationJobData {
  userId: string
  type: NotificationType
  title: string
  body: string
  data?: Record<string, unknown>
}

export async function notificationProcessor(job: Job<NotificationJobData>) {
  const { userId, type, title, body, data } = job.data

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
          data: data ?? {},
        },
      })
      await publishToUser(userId, 'notification:new', {
        notification: {
          ...notification,
          data: notification.data as Record<string, unknown> | null,
          createdAt: notification.createdAt.toISOString(),
        },
      })
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
          .catch((err: unknown) => {
            if (err && typeof err === 'object' && 'statusCode' in err) {
              const statusCode = (err as { statusCode: number }).statusCode
              if (statusCode === 410 || statusCode === 404) {
                return db.pushSubscription.delete({ where: { id: sub.id } })
              }
            }
            const errorMessage = err instanceof Error ? err.message : 'Push delivery failed'
            workerLogger.error({ subId: sub.id, error: errorMessage }, 'Push delivery failed')
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
