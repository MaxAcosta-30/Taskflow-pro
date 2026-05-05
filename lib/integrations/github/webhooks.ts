import crypto from 'crypto'

/**
 * Verifica la firma de un webhook de GitHub (X-Hub-Signature-256).
 * @param payload El cuerpo del webhook como string o buffer.
 * @param signature La firma recibida en los headers.
 * @param secret El secreto configurado en el webhook de GitHub.
 */
export function verifyGitHubSignature(payload: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false

  const hmac = crypto.createHmac('sha256', secret)
  const digest = 'sha256=' + hmac.update(payload).digest('hex')

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}
