import type { NextRequest } from 'next/server'

import { verifyGitHubSignature } from '@/lib/integrations/github/webhooks'
import { logger } from '@/lib/logger'
import { triggerAutomation } from '@/lib/queue'

/**
 * POST /api/webhooks
 * Punto de entrada único para webhooks externos (GitHub, NewsAPI, etc.)
 */
export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-hub-signature-256') || ''
  const githubSecret = process.env.GITHUB_WEBHOOK_SECRET || ''

  // 1. Validar firma si es un evento de GitHub
  if (req.headers.has('x-github-event')) {
    if (!verifyGitHubSignature(body, signature, githubSecret)) {
      logger.warn('Firma de webhook de GitHub inválida')
      return Response.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(body) as Record<string, unknown>
    const event = req.headers.get('x-github-event')

    logger.info({ event }, 'Webhook de GitHub recibido')

    // 2. Disparar automatizaciones vinculadas a eventos de GitHub
    // Por ahora, solo lanzamos el trigger al worker
    await triggerAutomation({
      automationId: 'GITHUB_EVENT', // Este es un placeholder, en realidad buscaríamos por repo/evento
      triggerType: 'WEBHOOK',
      triggerPayload: { source: 'github', event: event ?? 'unknown', ...payload },
    })

    return Response.json({ success: true })
  }

  // Soporte para otros webhooks (ej: NewsAPI)
  return Response.json({ message: 'Webhook received but no handler matched' })
}
