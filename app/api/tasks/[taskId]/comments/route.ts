// =============================================================
//  app/api/tasks/[taskId]/comments/route.ts
// =============================================================

import type { NextRequest } from 'next/server'

import { withAuth, parseBody, ok, created, serverError } from '@/lib/api/helpers'
import { db } from '@/lib/db'
import { emitToBoard } from '@/lib/socket/emitter'
import { createCommentSchema } from '@/lib/validations'

type Params = { params: { taskId: string } }

// ── GET — listar comentarios ──────────────────────────────────
export async function GET(req: NextRequest, { params }: Params) {
  return withAuth(req, async (user) => {
    try {
      const comments = await db.taskComment.findMany({
        where: {
          taskId: params.taskId,
          task:   { column: { board: { team: { members: { some: { userId: user.sub } } } } } },
        },
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { id: true, name: true, avatarUrl: true } } },
      })
      return ok(comments)
    } catch {
      return serverError()
    }
  })
}

// ── POST — crear comentario ───────────────────────────────────
export async function POST(req: NextRequest, { params }: Params) {
  return withAuth(req, async (user) => {
    const { data, error } = await parseBody(req, createCommentSchema)
    if (error) return error

    try {
      const task = await db.task.findFirst({
        where: {
          id:     params.taskId,
          column: { board: { team: { members: { some: { userId: user.sub } } } } },
        },
        include: { column: { select: { boardId: true } } },
      })
      if (!task) return Response.json({ success: false, error: 'Tarea no encontrada' }, { status: 404 })

      const comment = await db.taskComment.create({
        data:    { taskId: params.taskId, authorId: user.sub, content: data.content },
        include: { author: { select: { id: true, name: true, avatarUrl: true } } },
      })

      // Emit en tiempo real al board
      emitToBoard(task.column.boardId, 'comment:created', {
        comment: comment as never,
        taskId:  params.taskId,
      })

      return created(comment)
    } catch {
      return serverError()
    }
  })
}
