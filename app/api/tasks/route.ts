/* eslint-disable @typescript-eslint/require-await, @typescript-eslint/no-unused-vars */
// =============================================================
//  app/api/tasks/route.ts — POST /api/tasks
// =============================================================

import type { NextRequest } from 'next/server'

import { withAuth, parseBody, created, serverError } from '@/lib/api/helpers'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { invalidateCache, CACHE_KEYS } from '@/lib/redis'
import { emitToBoard } from '@/lib/socket/emitter'
import { createTaskSchema } from '@/lib/validations'

export async function POST(req: NextRequest) {
  return withAuth(req, async (user) => {
    const { data, error } = await parseBody(req, createTaskSchema)
    if (error) return error

    try {
      const { columnId, labelIds, ...rest } = data

      // Verificar que la columna existe y el usuario tiene acceso al board
      const column = await db.column.findFirst({
        where: {
          id:    columnId,
          board: { team: { members: { some: { userId: user.sub } } } },
        },
        include: { board: { select: { id: true } } },
      })

      if (!column) {
        return Response.json({ success: false, error: 'Columna no encontrada' }, { status: 404 })
      }

      // Calcular posición al final
      const lastTask = await db.task.findFirst({
        where:   { columnId },
        orderBy: { position: 'desc' },
        select:  { position: true },
      })

      const task = await db.task.create({
        data: {
          ...rest,
          columnId,
          creatorId: user.sub,
          position:  (lastTask?.position ?? -1) + 1,
          ...(labelIds?.length && {
            labels: { create: labelIds.map((id) => ({ labelId: id })) },
          }),
        },
        include: {
          creator:  { select: { id: true, name: true, avatarUrl: true } },
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          labels:   { include: { label: true } },
          _count:   { select: { comments: true } },
        },
      })

      // Invalidar cache del board
      await invalidateCache(CACHE_KEYS.board(column.board.id))

      // Emitir evento en tiempo real
      emitToBoard(column.board.id, 'task:created', { task: task as never, boardId: column.board.id })

      return created(task)
    } catch (err) {
      logger.error({ err }, 'Error creating task')
      return serverError()
    }
  })
}
