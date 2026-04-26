// =============================================================
//  lib/socket/emitter.ts — Socket.io Emitter Bridge
//  Manda mensajes a través de Redis Pub/Sub (vía Publisher)
//  para que el proceso servidor persistente los re-emita.
// =============================================================

import type { SocketEvents } from '@/types'
import { publishToBoard, publishToUser } from './publisher'

// ── API Routes y Workers: emitir a un tablero ───────────────────
export function emitToBoard<K extends keyof SocketEvents>(
  boardId: string,
  event: K,
  data: SocketEvents[K],
) {
  void publishToBoard(boardId, event, data)
}

// ── API Routes y Workers: emitir a un usuario específico ────────
export function emitToUser<K extends keyof SocketEvents>(
  userId: string,
  event: K,
  data: SocketEvents[K],
) {
  void publishToUser(userId, event, data)
}

// ── Aliases para compatibilidad con código de workers ───────────
export const emitToBoardFromWorker = emitToBoard
export const emitToUserFromWorker  = emitToUser
