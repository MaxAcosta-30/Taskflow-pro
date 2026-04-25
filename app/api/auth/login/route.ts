// =============================================================
//  app/api/auth/login/route.ts
// =============================================================

import type { NextRequest } from 'next/server'

import {
  comparePassword,
  setAuthCookies,
  createSession,
  getClientIp,
} from '@/lib/auth/helpers'
import { generateTokens } from '@/lib/auth/jwt'
import { db } from '@/lib/db'
import { authLogger } from '@/lib/logger'
import { checkRateLimit } from '@/lib/redis'
import { loginSchema } from '@/lib/validations'

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)

    // 1. Rate limiting: 10 intentos por IP cada 15 minutos
    const rateLimit = await checkRateLimit(`login:${ip}`, 10, 15 * 60)
    if (!rateLimit.allowed) {
      return Response.json(
        {
          success: false,
          error: 'Demasiados intentos. Espera unos minutos.',
          resetIn: rateLimit.resetIn,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset':     String(rateLimit.resetIn),
          },
        },
      )
    }

    // 2. Validar body
    const body = await req.json() as unknown
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { success: false, error: 'Email o contraseña inválidos' },
        { status: 422 },
      )
    }

    const { email, password } = parsed.data

    // 3. Buscar usuario (mensaje genérico para no revelar si el email existe)
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true, email: true, name: true,
        avatarUrl: true, role: true,
        passwordHash: true, isActive: true,
      },
    })

    const isValid = user?.passwordHash
      ? await comparePassword(password, user.passwordHash)
      : false

    if (!user || !isValid) {
      authLogger.warn({ email, ip }, 'Failed login attempt')
      return Response.json(
        { success: false, error: 'Email o contraseña incorrectos' },
        { status: 401 },
      )
    }

    if (!user.isActive) {
      return Response.json(
        { success: false, error: 'Esta cuenta ha sido desactivada' },
        { status: 403 },
      )
    }

    // 4. Generar tokens
    const tokens = generateTokens({
      sub:   user.id,
      email: user.email,
      role:  user.role,
    })

    // 5. Guardar sesión + actualizar lastLoginAt
    await Promise.all([
      createSession({
        userId:       user.id,
        refreshToken: tokens.refreshToken,
        userAgent:    req.headers.get('user-agent') ?? undefined,
        ipAddress:    ip,
      }),
      db.user.update({
        where: { id: user.id },
        data:  { lastLoginAt: new Date() },
      }),
    ])

    // 6. Setear cookies
    setAuthCookies(tokens.accessToken, tokens.refreshToken)

    authLogger.info({ userId: user.id }, 'User logged in')

    // Excluir passwordHash de la respuesta
    const { passwordHash: _, ...safeUser } = user

    return Response.json({
      success: true,
      data: { user: safeUser, tokens },
    })
  } catch (error) {
    authLogger.error({ error }, 'Login error')
    return Response.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 },
    )
  }
}
