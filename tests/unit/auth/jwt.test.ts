// =============================================================
//  tests/unit/auth/jwt.test.ts
// =============================================================

import { generateTokens, verifyAccessToken, verifyRefreshToken } from '@/lib/auth/jwt'

// Setear variables de entorno para tests
process.env.JWT_SECRET         = 'test_secret_super_long_at_least_32_chars_abc'
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_super_long_32_chars_xyz'
process.env.JWT_EXPIRES_IN     = '15m'
process.env.JWT_REFRESH_EXPIRES_IN = '7d'

describe('JWT Helpers', () => {
  const payload = { sub: 'user_123', email: 'test@test.com', role: 'MEMBER' }

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', () => {
      const tokens = generateTokens(payload)
      expect(tokens.accessToken).toBeDefined()
      expect(tokens.refreshToken).toBeDefined()
      expect(tokens.expiresIn).toBeGreaterThan(0)
    })

    it('access token should be a valid JWT with 3 parts', () => {
      const { accessToken } = generateTokens(payload)
      expect(accessToken.split('.')).toHaveLength(3)
    })
  })

  describe('verifyAccessToken', () => {
    it('should verify and return payload', () => {
      const { accessToken } = generateTokens(payload)
      const decoded = verifyAccessToken(accessToken)
      expect(decoded.sub).toBe(payload.sub)
      expect(decoded.email).toBe(payload.email)
      expect(decoded.role).toBe(payload.role)
    })

    it('should throw on invalid token', () => {
      expect(() => verifyAccessToken('invalid.token.here')).toThrow()
    })
  })

  describe('verifyRefreshToken', () => {
    it('should verify refresh token', () => {
      const { refreshToken } = generateTokens(payload)
      const decoded = verifyRefreshToken(refreshToken)
      expect(decoded.sub).toBe(payload.sub)
    })

    it('should throw if access token used as refresh', () => {
      const { accessToken } = generateTokens(payload)
      expect(() => verifyRefreshToken(accessToken)).toThrow()
    })
  })
})
