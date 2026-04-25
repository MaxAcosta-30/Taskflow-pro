/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
// =============================================================
//  lib/socket/index.ts — Socket.io Server
//  Maneja todos los eventos en tiempo real de la app
// =============================================================

import type { Server as HTTPServer } from 'http'

import { Server as SocketIOServer } from 'socket.io'

import { verifyAccessToken } from '@/lib/auth/jwt'
import { socketLogger } from '@/lib/logger'
import { activeWebSocketConnections } from '@/lib/metrics'
import { redis } from '@/lib/redis'
import type { SocketEvents } from '@/types'

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
    activeWebSocketConnections.inc()

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
      activeWebSocketConnections.dec()
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
