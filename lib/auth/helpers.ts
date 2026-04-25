/* eslint-disable @typescript-eslint/no-unsafe-return */
// =============================================================
//  lib/auth/helpers.ts — Password, Sessions, Request utils
// =============================================================

import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

import { db } from '@/lib/db'
import { redis, CACHE_KEYS, TTL } from '@/lib/redis'
import type { JwtPayload } from '@/types'

import { verifyAccessToken } from './jwt'

const SALT_ROUNDS = 12

// ── Password ──────────────────────────────────────────────────
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

// ── Cookie helpers ────────────────────────────────────────────
export function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = cookies()
  const isProd = process.env.NODE_ENV === 'production'

  cookieStore.set('access_token', accessToken, {
    httpOnly: true,
    secure:   isProd,
    sameSite: 'lax',
    maxAge:   15 * 60,           // 15 minutos
    path:     '/',
  })

  cookieStore.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure:   isProd,
    sameSite: 'lax',
    maxAge:   7 * 24 * 60 * 60,  // 7 días
    path:     '/api/auth/refresh',
  })
}

export function clearAuthCookies() {
  const cookieStore = cookies()
  cookieStore.delete('access_token')
  cookieStore.delete('refresh_token')
}

// ── Obtener usuario autenticado desde el request ──────────────
export async function getAuthUser(req: NextRequest): Promise<JwtPayload | null> {
  try {
    // 1. Intentar desde cookie (server components / SSR)
    let token = req.cookies.get('access_token')?.value

    // 2. Intentar desde header Authorization (API calls)
    if (!token) {
      const authHeader = req.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7)
      }
    }

    if (!token) return null

    // 3. Verificar si el token está revocado en Redis
    const isBlacklisted = await redis.get(`blacklist:${token}`)
    if (isBlacklisted) return null

    return verifyAccessToken(token)
  } catch {
    return null
  }
}

// ── Revocar token (logout) ────────────────────────────────────
export async function revokeToken(token: string, expiresInSeconds: number) {
  await redis.setex(`blacklist:${token}`, expiresInSeconds, '1')
}

// ── Guardar sesión en DB ──────────────────────────────────────
export async function createSession({
  userId,
  refreshToken,
  userAgent,
  ipAddress,
}: {
  userId: string
  refreshToken: string
  userAgent?: string
  ipAddress?: string
}) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  return db.session.create({
    data: {
      userId,
      refreshToken,
      userAgent,
      ipAddress,
      expiresAt,
    },
  })
}

// ── Cache de usuario ──────────────────────────────────────────
export async function getCachedUser(userId: string) {
  const cacheKey = CACHE_KEYS.user(userId)
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, name: true,
      avatarUrl: true, role: true, isActive: true, timezone: true,
    },
  })

  if (user) {
    await redis.setex(cacheKey, TTL.USER, JSON.stringify(user))
  }

  return user
}

// ── Parsear IP del request ────────────────────────────────────
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    '127.0.0.1'
  )
}

// ── Respuesta de error estandarizada ──────────────────────────
export function unauthorized(message = 'No autorizado') {
  return Response.json({ success: false, error: message }, { status: 401 })
}

export function forbidden(message = 'Acceso denegado') {
  return Response.json({ success: false, error: message }, { status: 403 })
}
