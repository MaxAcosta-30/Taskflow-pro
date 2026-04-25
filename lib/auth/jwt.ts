// =============================================================
//  lib/auth/jwt.ts — JWT Helpers
// =============================================================

import jwt from 'jsonwebtoken'

import type { JwtPayload, AuthTokens } from '@/types'

const JWT_SECRET         = process.env.JWT_SECRET!
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!
const JWT_EXPIRES_IN     = process.env.JWT_EXPIRES_IN  ?? '15m'
const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d'

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('JWT_SECRET y JWT_REFRESH_SECRET son requeridos en .env')
}

// ── Generar par de tokens ──────────────────────────────────────
export function generateTokens(payload: Omit<JwtPayload, 'iat' | 'exp'>): AuthTokens {
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  })

  const refreshToken = jwt.sign(
    { sub: payload.sub },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES as jwt.SignOptions['expiresIn'] },
  )

  // Calcular expiresIn en segundos
  const decoded = jwt.decode(accessToken) as { exp: number; iat: number }
  const expiresIn = decoded.exp - decoded.iat

  return { accessToken, refreshToken, expiresIn }
}

// ── Verificar access token ─────────────────────────────────────
export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload
}

// ── Verificar refresh token ───────────────────────────────────
export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, JWT_REFRESH_SECRET) as { sub: string }
}

// ── Decodificar sin verificar (para leer expiración) ──────────
export function decodeToken(token: string): JwtPayload | null {
  return jwt.decode(token) as JwtPayload | null
}
