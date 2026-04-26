import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';
import type { SocketEvents } from '@/types';

/**
 * Publisher: Envía mensajes a través de Redis Pub/Sub.
 * Es utilizado por las API Routes (serverless) para comunicarse con el
 * proceso servidor persistente (server.ts) que maneja los WebSockets.
 */

export const SOCKET_CHANNELS = {
  BOARD_UPDATES: 'socket:board:updates',
  USER_NOTIFICATIONS: 'socket:user:notifications',
} as const;

export async function publishToBoard<K extends keyof SocketEvents>(
  boardId: string,
  event: K,
  data: SocketEvents[K]
) {
  const payload = JSON.stringify({ boardId, event, data });
  await redis.publish(SOCKET_CHANNELS.BOARD_UPDATES, payload);
  logger.debug({ boardId, event }, 'Published board update to Redis');
}

export async function publishToUser<K extends keyof SocketEvents>(
  userId: string,
  event: K,
  data: SocketEvents[K]
) {
  const payload = JSON.stringify({ userId, event, data });
  await redis.publish(SOCKET_CHANNELS.USER_NOTIFICATIONS, payload);
  logger.debug({ userId, event }, 'Published user notification to Redis');
}
