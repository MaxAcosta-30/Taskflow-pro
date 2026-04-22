// =============================================================
//  lib/logger/index.ts — Structured Logger (Pino)
// =============================================================

import pino from 'pino'

const isDev = process.env.NODE_ENV === 'development'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  }),
  base: {
    app: 'taskflow-pro',
    env: process.env.NODE_ENV,
  },
  redact: {
    paths: ['password', 'passwordHash', 'accessToken', 'refreshToken', '*.password'],
    censor: '[REDACTED]',
  },
})

// Child loggers por módulo
export const authLogger    = logger.child({ module: 'auth' })
export const dbLogger      = logger.child({ module: 'db' })
export const queueLogger   = logger.child({ module: 'queue' })
export const socketLogger  = logger.child({ module: 'socket' })
export const workerLogger  = logger.child({ module: 'worker' })
