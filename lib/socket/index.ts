// =============================================================
//  lib/socket/index.ts — Socket.io Server
//  Maneja todos los eventos en tiempo real de la app
// =============================================================

import type { Server as HTTPServer } from 'http'

import { createAdapter } from '@socket.io/redis-adapter'
import type { Redis } from 'ioredis'
import { Server as SocketIOServer, type Socket } from 'socket.io'

import { verifyAccessToken } from '@/lib/auth/jwt'
import { socketLogger } from '@/lib/logger'
import { activeWebSocketConnections } from '@/lib/metrics'
import { redis } from '@/lib/redis'
import type { SocketEvents } from '@/types'

interface SocketData {
  userId: string
  email: string
}

// Singleton para el servidor IO y el cliente de suscripción
const globalForSocket = global as unknown as {
  io: SocketIOServer | null
  redisSubClient: Redis | null
}

export function initSocketServer(httpServer: HTTPServer) {
  if (globalForSocket.io) return globalForSocket.io

  const io = new SocketIOServer(httpServer, {
    path: '/socket.io',
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  globalForSocket.io = io

  // Usar Redis Adapter para sincronizar instancias y workers
  const subClientForAdapter = redis.duplicate()
  io.adapter(createAdapter(redis, subClientForAdapter))

  // ── Suscripción única a Redis Pub/Sub ─────────────────────
  if (!globalForSocket.redisSubClient) {
    const subscriber = redis.duplicate()
    globalForSocket.redisSubClient = subscriber

    void subscriber.psubscribe('board:*', 'user:*')

    subscriber.on('pmessage', (_pattern: string, channel: string, message: string) => {
      try {
        const { event, data } = JSON.parse(message) as { event: string; data: unknown }

        if (channel.startsWith('board:')) {
          const boardId = channel.replace('board:', '')
          globalForSocket.io?.to(`board:${boardId}`).emit(event, data)
          socketLogger.debug({ boardId, event }, 'Re-emitted board update from Redis')
        } else if (channel.startsWith('user:')) {
          const userId = channel.replace('user:', '')
          globalForSocket.io?.to(`user:${userId}`).emit(event, data)
          socketLogger.debug({ userId, event }, 'Re-emitted user notification from Redis')
        }
      } catch (err: unknown) {
        const error = err instanceof Error ? err.message : String(err)
        socketLogger.error({ error, channel }, 'Failed to process Redis pub/sub message')
      }
    })
  }

  // ── Middleware de autenticación ──────────────────────────
  io.use((socket: Socket, next: (err?: Error) => void) => {
    try {
      const token =
        (socket.handshake.auth['token'] as string | undefined) ??
        socket.handshake.headers.cookie
          ?.split(';')
          .find((c: string) => c.trim().startsWith('access_token='))
          ?.split('=')[1]

      if (!token) return next(new Error('Unauthorized'))

      void (async () => {
        try {
          const isBlacklisted = await redis.get(`blacklist:${token}`)
          if (isBlacklisted) return next(new Error('Token revoked'))

          const payload = verifyAccessToken(token)
          const data = socket.data as SocketData
          data.userId = payload.sub
          data.email = payload.email
          next()
        } catch {
          next(new Error('Invalid token'))
        }
      })()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  // ── Conexión ─────────────────────────────────────────────
  io.on('connection', (socket: Socket) => {
    const data = socket.data as SocketData
    const userId = data.userId
    socketLogger.info({ userId, socketId: socket.id }, 'Client connected')
    activeWebSocketConnections.inc()

    // Unirse a room personal del usuario
    void socket.join(`user:${userId}`)

    socket.on('board:join', (boardId: string) => {
      void (async () => {
        await socket.join(`board:${boardId}`)
        socket.to(`board:${boardId}`).emit('user:joined', { userId, boardId })
        socketLogger.debug({ userId, boardId }, 'User joined board room')
      })()
    })

    socket.on('board:leave', (boardId: string) => {
      void (async () => {
        await socket.leave(`board:${boardId}`)
        socket.to(`board:${boardId}`).emit('user:left', { userId, boardId })
      })()
    })

    socket.on('disconnect', () => {
      socketLogger.info({ userId, socketId: socket.id }, 'Client disconnected')
      activeWebSocketConnections.dec()
    })
  })

  socketLogger.info('Socket.io server initialized')
  return io
}

export function emitToBoard<K extends keyof SocketEvents>(
  boardId: string,
  event: K,
  data: SocketEvents[K],
) {
  globalForSocket.io?.to(`board:${boardId}`).emit(event, data)
}

export function emitToUser<K extends keyof SocketEvents>(
  userId: string,
  event: K,
  data: SocketEvents[K],
) {
  globalForSocket.io?.to(`user:${userId}`).emit(event, data)
}

export const io = globalForSocket.io
