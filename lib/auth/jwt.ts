// =============================================================
//  lib/auth/jwt.ts — JWT Helpers
// =============================================================

import jwt from 'jsonwebtoken'

import type { JwtPayload, AuthTokens } from '@/types'

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '15m'
const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d'

// Los secretos se leen al usarse, no al importar: `next build` (y la imagen de Docker) importa
// las rutas sin secretos; en ejecución, si faltan, el error sigue siendo inmediato y claro.
function secreto(nombre: 'JWT_SECRET' | 'JWT_REFRESH_SECRET'): string {
  const valor = process.env[nombre]
  if (!valor) throw new Error('JWT_SECRET y JWT_REFRESH_SECRET son requeridos en .env')
  return valor
}

// ── Generar par de tokens ──────────────────────────────────────
export function generateTokens(payload: Omit<JwtPayload, 'iat' | 'exp'>): AuthTokens {
  const accessToken = jwt.sign(payload, secreto('JWT_SECRET'), {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  })

  const refreshToken = jwt.sign({ sub: payload.sub }, secreto('JWT_REFRESH_SECRET'), {
    expiresIn: JWT_REFRESH_EXPIRES as jwt.SignOptions['expiresIn'],
  })

  // Calcular expiresIn en segundos
  const decoded = jwt.decode(accessToken) as { exp: number; iat: number }
  const expiresIn = decoded.exp - decoded.iat

  return { accessToken, refreshToken, expiresIn }
}

// ── Verificar access token ─────────────────────────────────────
export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, secreto('JWT_SECRET')) as JwtPayload
}

// ── Verificar refresh token ───────────────────────────────────
export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, secreto('JWT_REFRESH_SECRET')) as { sub: string }
}

// ── Decodificar sin verificar (para leer expiración) ──────────
export function decodeToken(token: string): JwtPayload | null {
  return jwt.decode(token) as JwtPayload | null
}
