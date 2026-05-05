/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
// =============================================================
//  lib/db/index.ts — Prisma Client Singleton
//  Evita múltiples conexiones en desarrollo con hot-reload
// =============================================================

import { PrismaClient, Prisma } from '@prisma/client'

import { logger } from '@/lib/logger'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient<Prisma.PrismaClientOptions, 'query' | 'error' | 'warn'> | undefined
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
  db.$on('query', (e: Prisma.QueryEvent) => {
    logger.debug({ query: e.query, duration: `${e.duration}ms` }, 'DB Query')
  })
}

db.$on('error', (e: Prisma.LogEvent) => {
  logger.error({ message: e.message }, 'DB Error')
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
