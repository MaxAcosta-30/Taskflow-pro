// =============================================================
//  app/api/auth/refresh/route.ts — Renovar access token
// =============================================================

import type { NextRequest } from 'next/server'

import { setAuthCookies, getClientIp } from '@/lib/auth/helpers'
import { generateTokens, verifyRefreshToken } from '@/lib/auth/jwt'
import { db } from '@/lib/db'
import { authLogger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    // Obtener refresh token desde cookie (path restringido a /api/auth/refresh)
    const refreshToken = req.cookies.get('refresh_token')?.value

    if (!refreshToken) {
      return Response.json(
        { success: false, error: 'Refresh token no encontrado' },
        { status: 401 },
      )
    }

    // 1. Verificar firma del refresh token
    let payload: { sub: string }
    try {
      payload = verifyRefreshToken(refreshToken)
    } catch {
      return Response.json(
        { success: false, error: 'Refresh token inválido o expirado' },
        { status: 401 },
      )
    }

    // 2. Buscar sesión en DB (verifica que no fue revocada)
    const session = await db.session.findFirst({
      where: {
        refreshToken,
        userId:    payload.sub,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: { id: true, email: true, role: true, isActive: true },
        },
      },
    })

    if (!session || !session.user.isActive) {
      return Response.json(
        { success: false, error: 'Sesión inválida o expirada' },
        { status: 401 },
      )
    }

    // 3. Revocar sesión anterior y crear nueva (rotation)
    await db.session.update({
      where: { id: session.id },
      data:  { isRevoked: true },
    })

    const newTokens = generateTokens({
      sub:   session.user.id,
      email: session.user.email,
      role:  session.user.role,
    })

    await db.session.create({
      data: {
        userId:       session.user.id,
        refreshToken: newTokens.refreshToken,
        userAgent:    req.headers.get('user-agent') ?? undefined,
        ipAddress:    getClientIp(req),
        expiresAt:    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    setAuthCookies(newTokens.accessToken, newTokens.refreshToken)

    authLogger.debug({ userId: session.user.id }, 'Tokens refreshed')

    return Response.json({ success: true, data: { tokens: newTokens } })
  } catch (error) {
    authLogger.error({ error }, 'Refresh error')
    return Response.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 },
    )
  }
}
