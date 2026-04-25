// =============================================================
//  app/api/auth/logout/route.ts
// =============================================================

import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

import { clearAuthCookies, revokeToken, getAuthUser } from '@/lib/auth/helpers'
import { decodeToken } from '@/lib/auth/jwt'
import { db } from '@/lib/db'
import { authLogger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)

    // Revocar access token en Redis blacklist
    const accessToken = req.cookies.get('access_token')?.value
    if (accessToken) {
      const decoded = decodeToken(accessToken)
      if (decoded?.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000)
        if (ttl > 0) await revokeToken(accessToken, ttl)
      }
    }

    // Revocar refresh token en DB
    const refreshToken = cookies().get('refresh_token')?.value
    if (refreshToken) {
      await db.session.updateMany({
        where: { refreshToken },
        data:  { isRevoked: true },
      })
    }

    // Limpiar cookies
    clearAuthCookies()

    authLogger.info({ userId: user?.sub }, 'User logged out')

    return Response.json({ success: true, message: 'Sesión cerrada exitosamente' })
  } catch (error) {
    authLogger.error({ error }, 'Logout error')
    // Siempre limpiar cookies aunque falle
    clearAuthCookies()
    return Response.json({ success: true, message: 'Sesión cerrada' })
  }
}
