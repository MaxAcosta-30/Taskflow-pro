// =============================================================
//  app/api/auth/register/route.ts
// =============================================================

import type { NextRequest } from 'next/server'

import { hashPassword, setAuthCookies, createSession, getClientIp } from '@/lib/auth/helpers'
import { generateTokens } from '@/lib/auth/jwt'
import { db } from '@/lib/db'
import { authLogger } from '@/lib/logger'
import { invalidateCache } from '@/lib/redis'
import { registerSchema } from '@/lib/validations'

export async function POST(req: NextRequest) {
  try {
    // 1. Validar body con Zod
    const body = await req.json() as unknown
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { success: false, error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 422 },
      )
    }

    const { name, email, password } = parsed.data

    // 2. Verificar que el email no exista
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return Response.json(
        { success: false, error: 'Este email ya está registrado' },
        { status: 409 },
      )
    }

    // 3. Crear usuario con contraseña hasheada
    const passwordHash = await hashPassword(password)

    const user = await db.user.create({
      data: { name, email, passwordHash },
      select: { id: true, email: true, name: true, avatarUrl: true, role: true },
    })

    // 4. Generar tokens JWT
    const tokens = generateTokens({
      sub:   user.id,
      email: user.email,
      role:  user.role,
    })

    // 5. Guardar sesión en DB
    await createSession({
      userId:       user.id,
      refreshToken: tokens.refreshToken,
      userAgent:    req.headers.get('user-agent') ?? undefined,
      ipAddress:    getClientIp(req),
    })

    // 6. Actualizar lastLoginAt
    await db.user.update({
      where: { id: user.id },
      data:  { lastLoginAt: new Date() },
    })

    // 7. Setear cookies httpOnly
    setAuthCookies(tokens.accessToken, tokens.refreshToken)

    authLogger.info({ userId: user.id, email: user.email }, 'User registered')

    return Response.json(
      {
        success: true,
        data: { user, tokens },
        message: '¡Bienvenido a TaskFlow Pro!',
      },
      { status: 201 },
    )
  } catch (error) {
    authLogger.error({ error }, 'Register error')
    return Response.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 },
    )
  }
}
