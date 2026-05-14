import type { NotificationType } from '@prisma/client'
import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { withAuth, parseBody, ok, serverError } from '@/lib/api/helpers'
import { db } from '@/lib/db'

const updateSettingsSchema = z.array(
  z.object({
    type: z.string(),
    email: z.boolean(),
    push: z.boolean(),
    inApp: z.boolean(),
  }),
)

/**
 * GET /api/notifications/settings
 * Retorna las preferencias de notificación del usuario.
 */
export async function GET(req: NextRequest) {
  return withAuth(req, async (user) => {
    try {
      const settings = await db.notificationSetting.findMany({
        where: { userId: user.sub },
      })
      return ok(settings)
    } catch (err) {
      console.error('[GET_NOTIF_SETTINGS_ERROR]', err)
      return serverError()
    }
  })
}

/**
 * PUT /api/notifications/settings
 * Actualiza en masa las preferencias de notificación.
 */
export async function PUT(req: NextRequest) {
  return withAuth(req, async (user) => {
    const { data, error } = await parseBody(req, updateSettingsSchema)
    if (error) return error

    try {
      await db.$transaction(
        data.map((setting) =>
          db.notificationSetting.upsert({
            where: {
              userId_type: {
                userId: user.sub,
                type: setting.type as NotificationType,
              },
            },
            update: {
              email: setting.email,
              push: setting.push,
              inApp: setting.inApp,
            },
            create: {
              userId: user.sub,
              type: setting.type as NotificationType,
              email: setting.email,
              push: setting.push,
              inApp: setting.inApp,
            },
          }),
        ),
      )

      return ok({ message: 'Preferencias actualizadas' })
    } catch (err) {
      console.error('[NOTIF_SETTINGS_ERROR]', err)
      return serverError()
    }
  })
}
