// =============================================================
//  lib/socket/emitter.ts — Redis Socket.IO Emitter
//  Permite emitir eventos WS desde API routes y workers sin necesitar
//  la instancia directa del servidor Socket.io.
//  El servidor Socket.io recibe el mensaje via Redis y lo reenvía.
// =============================================================

import { Emitter } from '@socket.io/redis-emitter'

import { redis } from '@/lib/redis'
import type { SocketEvents } from '@/types'

// Inicializamos el emisor conectándolo al mismo Redis que usa el servidor
export const socketEmitter = new Emitter(redis)

// ── API Routes y Workers: emitir a un tablero ───────────────────
export function emitToBoard<K extends keyof SocketEvents>(
  boardId: string,
  event: K,
  data: SocketEvents[K],
) {
  socketEmitter.to(`board:${boardId}`).emit(event as string, data)
}

// ── API Routes y Workers: emitir a un usuario específico ────────
export function emitToUser<K extends keyof SocketEvents>(
  userId: string,
  event: K,
  data: SocketEvents[K],
) {
  socketEmitter.to(`user:${userId}`).emit(event as string, data)
}

// ── Aliases para compatibilidad con código de workers ───────────
export const emitToBoardFromWorker = emitToBoard
export const emitToUserFromWorker  = emitToUser
