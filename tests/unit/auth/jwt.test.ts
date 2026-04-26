import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { 
  generateTokens, 
  verifyAccessToken, 
  verifyRefreshToken, 
  decodeToken 
} from '@/lib/auth/jwt';
import { 
  loginSchema, 
  refreshTokenSchema 
} from '@/lib/validations';

describe('JWT Auth - Helpers', () => {
  const payload = { sub: 'user_abc', email: 'admin@taskflow.pro', role: 'ADMIN' as any };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('generateTokens', () => {
    it('debe generar tokens con la estructura correcta', () => {
      const tokens = generateTokens(payload);
      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(tokens).toHaveProperty('expiresIn');
      expect(typeof tokens.expiresIn).toBe('number');
    });

    it('el payload decodificado debe coincidir con la entrada', () => {
      const { accessToken } = generateTokens(payload);
      const decoded = jwt.decode(accessToken) as any;
      expect(decoded.sub).toBe(payload.sub);
      expect(decoded.role).toBe(payload.role);
    });
  });

  describe('verifyAccessToken', () => {
    it('debe validar un token legitimo', () => {
      const { accessToken } = generateTokens(payload);
      const verified = verifyAccessToken(accessToken);
      expect(verified.sub).toBe(payload.sub);
    });

    it('debe fallar si la firma es incorrecta', () => {
      const tokenInvalido = jwt.sign(payload, 'otra-llave-distinta');
      expect(() => verifyAccessToken(tokenInvalido)).toThrow();
    });

    it('debe fallar si el token ha expirado', () => {
      const { accessToken } = generateTokens(payload);
      // Adelantar el tiempo 20 minutos (el token expira en 15m por defecto)
      vi.advanceTimersByTime(20 * 60 * 1000);
      expect(() => verifyAccessToken(accessToken)).toThrow();
    });
  });

  describe('decodeToken', () => {
    it('debe retornar el payload incluso si el token ha expirado', () => {
      const { accessToken } = generateTokens(payload);
      vi.advanceTimersByTime(20 * 60 * 1000);
      const decoded = decodeToken(accessToken);
      expect(decoded?.sub).toBe(payload.sub);
    });
  });
});

describe('Zod Validation - Auth Schemas', () => {
  describe('loginSchema', () => {
    it('debe validar un login correcto', () => {
      const result = loginSchema.safeParse({
        email: 'test@taskflow.pro',
        password: 'password123'
      });
      expect(result.success).toBe(true);
    });

    it('debe fallar con email mal formado', () => {
      const result = loginSchema.safeParse({
        email: 'no-es-email',
        password: 'password123'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('refreshTokenSchema', () => {
    it('debe requerir el campo refreshToken', () => {
      const result = refreshTokenSchema.safeParse({ token: 'abc' });
      expect(result.success).toBe(false);
    });

    it('debe aceptar un string no vacio', () => {
      const result = refreshTokenSchema.safeParse({ refreshToken: 'some-jwt-string' });
      expect(result.success).toBe(true);
    });
  });
});
