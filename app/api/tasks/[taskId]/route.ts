// =============================================================
//  app/api/tasks/[taskId]/route.ts
// =============================================================

import type { NextRequest } from 'next/server'

import { withAuth, parseBody, ok, notFound, serverError } from '@/lib/api/helpers'
import { db } from '@/lib/db'
import { queueNotification } from '@/lib/queue'
import { invalidateCache, CACHE_KEYS } from '@/lib/redis'
import { emitToBoard } from '@/lib/socket/emitter'
import { updateTaskSchema } from '@/lib/validations'

type Params = { params: { taskId: string } }

// ── GET /api/tasks/:id ────────────────────────────────────────
export async function GET(req: NextRequest, { params }: Params) {
  return withAuth(req, async (user) => {
    const task = await db.task.findFirst({
      where: {
        id:     params.taskId,
        column: { board: { team: { members: { some: { userId: user.sub } } } } },
      },
      include: {
        creator:  { select: { id: true, name: true, avatarUrl: true } },
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        labels:   { include: { label: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { id: true, name: true, avatarUrl: true } } },
        },
        column: { select: { id: true, name: true, boardId: true } },
      },
    })

    if (!task) return notFound('Tarea no encontrada')
    return ok(task)
  })
}

// ── PATCH /api/tasks/:id ──────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  return withAuth(req, async (user) => {
    const { data, error } = await parseBody(req, updateTaskSchema)
    if (error) return error

    try {
      const existing = await db.task.findFirst({
        where: {
          id:     params.taskId,
          column: { board: { team: { members: { some: { userId: user.sub } } } } },
        },
        include: { column: { select: { boardId: true } } },
      })
      if (!existing) return notFound()

      const { labelIds, ...rest } = data as typeof data & { labelIds?: string[] }

      const task = await db.task.update({
        where: { id: params.taskId },
        data: {
          ...rest,
          // Si se completó, guardar timestamp
          ...(rest.status === 'DONE' && !existing.completedAt && { completedAt: new Date() }),
          ...(rest.status === 'IN_PROGRESS' && !existing.startedAt && { startedAt: new Date() }),
          // Actualizar labels si se proveen
          ...(labelIds !== undefined && {
            labels: {
              deleteMany: {},
              create: labelIds.map((id) => ({ labelId: id })),
            },
          }),
        },
        include: {
          creator:  { select: { id: true, name: true, avatarUrl: true } },
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          labels:   { include: { label: true } },
          _count:   { select: { comments: true } },
        },
      })

      const boardId = existing.column.boardId
      await invalidateCache(CACHE_KEYS.board(boardId))
      emitToBoard(boardId, 'task:updated', { task: task as never, boardId })

      // Notificar al asignado si cambió
      if (data.assigneeId && data.assigneeId !== existing.assigneeId) {
        await queueNotification({
          userId: data.assigneeId,
          type:   'TASK_ASSIGNED',
          title:  'Nueva tarea asignada',
          body:   `Se te asignó: "${task.title}"`,
          data:   { taskId: task.id, boardId },
        })
      }

      return ok(task)
    } catch {
      return serverError()
    }
  })
}

// ── DELETE /api/tasks/:id ─────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  return withAuth(req, async (user) => {
    try {
      const task = await db.task.findFirst({
        where: {
          id:     params.taskId,
          column: { board: { team: { members: { some: { userId: user.sub } } } } },
        },
        include: { column: { select: { boardId: true } } },
      })
      if (!task) return notFound()

      await db.task.delete({ where: { id: params.taskId } })

      const boardId = task.column.boardId
      await invalidateCache(CACHE_KEYS.board(boardId))
      emitToBoard(boardId, 'task:deleted', { taskId: params.taskId, boardId })

      return ok({ message: 'Tarea eliminada' })
    } catch {
      return serverError()
    }
  })
}
