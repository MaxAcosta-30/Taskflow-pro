// =============================================================
//  lib/db/index.ts — Prisma Client Singleton
//  Evita múltiples conexiones en desarrollo con hot-reload
// =============================================================

import { PrismaClient } from '@prisma/client'

import { logger } from '@/lib/logger'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
          ]
        : [{ emit: 'event', level: 'error' }],
  })

// Log queries en desarrollo
if (process.env.NODE_ENV === 'development') {
  db.$on('query', (e) => {
    logger.debug({ query: e.query, duration: `${e.duration}ms` }, 'DB Query')
  })
}

db.$on('error', (e) => {
  logger.error({ message: e.message }, 'DB Error')
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
