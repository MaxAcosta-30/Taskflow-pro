// =============================================================
//  lib/socket/publisher.ts — Redis pub/sub bridge para Socket.io
//  Las API routes usan esto para emitir eventos en tiempo real
//  sin depender del servidor Socket.io directamente
// =============================================================

import { redis } from '@/lib/redis'
import type { SocketEvents } from '@/types'

export async function publishToBoard<K extends keyof SocketEvents>(
  boardId: string,
  event: K,
  data: SocketEvents[K],
): Promise<void> {
  await redis.publish(`board:${boardId}`, JSON.stringify({ event, data }))
}

export async function publishToUser<K extends keyof SocketEvents>(
  userId: string,
  event: K,
  data: SocketEvents[K],
): Promise<void> {
  await redis.publish(`user:${userId}`, JSON.stringify({ event, data }))
}
