// =============================================================
//  app/api/webhooks/[automationId]/route.ts
//  Webhook entrante — dispara automatizaciones tipo WEBHOOK
//  Verifica firma HMAC-SHA256 si el secret está configurado
// =============================================================

import crypto from 'crypto'

import type { NextRequest } from 'next/server'

import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { triggerAutomation } from '@/lib/queue'

type Params = { params: { automationId: string } }

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const automation = await db.automation.findFirst({
      where: {
        id: params.automationId,
        isActive: true,
        triggerType: 'WEBHOOK',
      },
      select: { id: true, triggerConfig: true },
    })

    if (!automation) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const config = automation.triggerConfig as Record<string, unknown>
    const secret = config['secret'] as string | undefined

    // Verificar firma HMAC-SHA256 si hay secret configurado
    if (secret) {
      const rawBody = await req.text()
      const signature = req.headers.get('x-hub-signature-256') ?? ''

      const expected = `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`

      // Comparación en tiempo constante para prevenir timing attacks
      const sigBuffer = Buffer.from(signature)
      const expBuffer = Buffer.from(expected)

      const isValid =
        sigBuffer.length === expBuffer.length && crypto.timingSafeEqual(sigBuffer, expBuffer)

      if (!isValid) {
        logger.warn({ automationId: params.automationId }, 'Invalid webhook signature')
        return Response.json({ error: 'Invalid signature' }, { status: 401 })
      }

      // Parsear el body que ya leímos como texto
      let payload: Record<string, unknown> = {}
      try {
        payload = JSON.parse(rawBody) as Record<string, unknown>
      } catch {
        // Payload no es JSON — ok, el body puede ser form-encoded u otro formato
      }

      await triggerAutomation({
        automationId: automation.id,
        triggerType: 'WEBHOOK',
        triggerPayload: payload,
      })
    } else {
      // Sin secret — aceptar cualquier payload
      const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>

      await triggerAutomation({
        automationId: automation.id,
        triggerType: 'WEBHOOK',
        triggerPayload: payload,
      })
    }

    return Response.json({ received: true })
  } catch (err) {
    logger.error({ err }, 'Webhook processing error')
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
