import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { withAuth, parseBody, ok, serverError } from '@/lib/api/helpers'
import { db } from '@/lib/db'

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
})

/**
 * POST /api/notifications/push
 * Registra o actualiza una suscripción Web Push del navegador del usuario.
 */
export async function POST(req: NextRequest) {
  return withAuth(req, async (user) => {
    const { data, error } = await parseBody(req, pushSubscriptionSchema)
    if (error) return error

    try {
      await db.pushSubscription.upsert({
        where: { endpoint: data.endpoint },
        update: {
          userId: user.sub,
          p256dh: data.keys.p256dh,
          auth: data.keys.auth,
          userAgent: req.headers.get('user-agent'),
        },
        create: {
          userId: user.sub,
          endpoint: data.endpoint,
          p256dh: data.keys.p256dh,
          auth: data.keys.auth,
          userAgent: req.headers.get('user-agent'),
        },
      })

      return ok({ message: 'Suscripción registrada exitosamente' })
    } catch (err) {
      console.error('[PUSH_SUBSCRIPTION_ERROR]', err)
      return serverError()
    }
  })
}

/**
 * DELETE /api/notifications/push
 * Elimina una suscripción (ej: cuando el usuario desactiva notificaciones).
 */
export async function DELETE(req: NextRequest) {
  return withAuth(req, async (user) => {
    const body = (await req.json()) as { endpoint?: string }
    const endpoint = body.endpoint
    if (!endpoint) return Response.json({ error: 'Endpoint requerido' }, { status: 400 })

    try {
      await db.pushSubscription.deleteMany({
        where: { endpoint, userId: user.sub },
      })
      return ok({ message: 'Suscripción eliminada' })
    } catch (err) {
      console.error('[DELETE_PUSH_SUBSCRIPTION_ERROR]', err)
      return serverError()
    }
  })
}
