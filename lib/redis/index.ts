// =============================================================
//  lib/redis/index.ts — Redis Client + Cache Helpers
// =============================================================

import Redis from 'ioredis'

import { logger } from '@/lib/logger'

// ── Cliente principal ──────────────────────────────────────────
const globalForRedis = globalThis as unknown as { redis: Redis | undefined }

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: true,
  })

redis.on('connect', () => logger.info('Redis connected'))
redis.on('error', (err) => logger.error({ err }, 'Redis error'))
redis.on('reconnecting', () => logger.warn('Redis reconnecting...'))

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis
}

// ── Prefijos de keys (evita colisiones) ────────────────────────
export const CACHE_KEYS = {
  user:         (id: string)        => `user:${id}`,
  userSession:  (token: string)     => `session:${token}`,
  board:        (id: string)        => `board:${id}`,
  boardMembers: (boardId: string)   => `board:${boardId}:members`,
  task:         (id: string)        => `task:${id}`,
  teamBoards:   (teamId: string)    => `team:${teamId}:boards`,
  weather:      (lat: number, lon: number) => `weather:${lat}:${lon}`,
  news:         (query: string)     => `news:${query}`,
  rateLimit:    (ip: string, route: string) => `ratelimit:${ip}:${route}`,
} as const

// ── TTLs en segundos ───────────────────────────────────────────
export const TTL = {
  USER:       60 * 60,        // 1 hora
  BOARD:      60 * 5,         // 5 minutos
  WEATHER:    60 * 30,        // 30 minutos
  NEWS:       60 * 60,        // 1 hora
  SHORT:      60,             // 1 minuto
} as const

// ── Helpers ───────────────────────────────────────────────────

/**
 * Obtiene un valor cacheado. Si no existe, lo genera y cachea.
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = TTL.SHORT,
): Promise<T> {
  const cached = await redis.get(key)
  if (cached) return JSON.parse(cached) as T

  const value = await fetcher()
  await redis.setex(key, ttl, JSON.stringify(value))
  return value
}

/**
 * Invalida una o múltiples keys de cache.
 */
export async function invalidateCache(...keys: string[]): Promise<void> {
  if (keys.length === 0) return
  await redis.del(...keys)
}

/**
 * Invalida todas las keys que empiecen con un prefijo.
 */
export async function invalidateCacheByPattern(pattern: string): Promise<void> {
  const keys = await redis.keys(`${pattern}*`)
  if (keys.length > 0) {
    await redis.del(...keys)
  }
}

/**
 * Rate limiter simple basado en Redis.
 * Retorna true si el request está permitido.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const current = await redis.incr(key)

  if (current === 1) {
    await redis.expire(key, windowSeconds)
  }

  const ttl = await redis.ttl(key)

  return {
    allowed: current <= limit,
    remaining: Math.max(0, limit - current),
    resetIn: ttl,
  }
}
