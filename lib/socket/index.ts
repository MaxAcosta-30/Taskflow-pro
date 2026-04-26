/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
// =============================================================
//  lib/socket/index.ts — Socket.io Server
//  Maneja todos los eventos en tiempo real de la app
// =============================================================

import type { Server as HTTPServer } from 'http'

import { Server as SocketIOServer } from 'socket.io'

import { createAdapter } from '@socket.io/redis-adapter'

import { verifyAccessToken } from '@/lib/auth/jwt'
import { socketLogger } from '@/lib/logger'
import {
  websocketConnectionsActive,
} from '@/lib/metrics'
import { redis } from '@/lib/redis'
import type { SocketEvents } from '@/types'
import { SOCKET_CHANNELS } from './publisher'

let io: any = null

export function initSocketServer(httpServer: HTTPServer) {
  if (io) return io

  io = new SocketIOServer(httpServer, {
    path: '/socket.io',
    cors: {
      origin:      process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  // Usar Redis Adapter para sincronizar instancias y workers
  const subClientForAdapter = redis.duplicate()
  io.adapter(createAdapter(redis, subClientForAdapter))

  // ── Suscripción a Redis Pub/Sub para Publisher Custom ─────
  const subClient = redis.duplicate()
  void subClient.subscribe(
    SOCKET_CHANNELS.BOARD_UPDATES,
    SOCKET_CHANNELS.USER_NOTIFICATIONS
  )

  subClient.on('message', (channel, message) => {
    try {
      const payload = JSON.parse(message)
      if (channel === SOCKET_CHANNELS.BOARD_UPDATES) {
        const { boardId, event, data } = payload
        io.to(`board:${boardId}`).emit(event, data)
        socketLogger.debug({ boardId, event }, 'Re-emitted board update from Redis')
      } else if (channel === SOCKET_CHANNELS.USER_NOTIFICATIONS) {
        const { userId, event, data } = payload
        io.to(`user:${userId}`).emit(event, data)
        socketLogger.debug({ userId, event }, 'Re-emitted user notification from Redis')
      }
    } catch (err: any) {
      socketLogger.error({ err: err.message }, 'Error processing Redis Pub/Sub message')
    }
  })

  // ── Middleware de autenticación ──────────────────────────
  io.use(async (socket: any, next: any) => {
    try {
      const token =
        socket.handshake.auth.token as string |undefined ??
        socket.handshake.headers.cookie
          ?.split(';')
          .find((c: string) => c.trim().startsWith('access_token='))
          ?.split('=')[1]

      if (!token) return next(new Error('Unauthorized'))

      const isBlacklisted = await redis.get(`blacklist:${token}`)
      if (isBlacklisted) return next(new Error('Token revoked'))

      const payload = verifyAccessToken(token)
      socket.data.userId = payload.sub
      socket.data.email  = payload.email
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  // ── Conexión ─────────────────────────────────────────────
  io.on('connection', (socket: any) => {
    const userId = socket.data.userId as string
    socketLogger.info({ userId, socketId: socket.id }, 'Client connected')
    websocketConnectionsActive.inc()

    // Unirse a room personal del usuario (para notificaciones directas)
    void socket.join(`user:${userId}`)

    // ── Unirse a un tablero ─────────────────────────────────
    socket.on('board:join', async (boardId: string) => {
      await socket.join(`board:${boardId}`)
      // Notificar a otros en el tablero
      socket.to(`board:${boardId}`).emit('user:joined', { userId, boardId })
      socketLogger.debug({ userId, boardId }, 'User joined board room')
    })

    // ── Salir de un tablero ────────────────────────────────
    socket.on('board:leave', async (boardId: string) => {
      await socket.leave(`board:${boardId}`)
      socket.to(`board:${boardId}`).emit('user:left', { userId, boardId })
    })

    // ── Desconexión ────────────────────────────────────────
    socket.on('disconnect', () => {
      socketLogger.info({ userId, socketId: socket.id }, 'Client disconnected')
      websocketConnectionsActive.dec()
    })
  })

  socketLogger.info('Socket.io server initialized')
  return io
}

// ── Emitir a un room de tablero ───────────────────────────────
export function emitToBoard<K extends keyof SocketEvents>(
  boardId: string,
  event: K,
  data: SocketEvents[K],
) {
  io?.to(`board:${boardId}`).emit(event, data)
}

// ── Emitir a un usuario específico ───────────────────────────
export function emitToUser<K extends keyof SocketEvents>(
  userId: string,
  event: K,
  data: SocketEvents[K],
) {
  io?.to(`user:${userId}`).emit(event, data)
}

export { io }
