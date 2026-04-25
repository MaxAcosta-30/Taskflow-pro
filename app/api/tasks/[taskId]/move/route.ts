// =============================================================
//  app/api/tasks/[taskId]/move/route.ts — Mover tarea (drag & drop)
// =============================================================

import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { withAuth, parseBody, ok, notFound, serverError } from '@/lib/api/helpers'
import { db } from '@/lib/db'
import { invalidateCache, CACHE_KEYS } from '@/lib/redis'
import { emitToBoard } from '@/lib/socket/emitter'

const moveSchema = z.object({
  toColumnId: z.string().cuid(),
  position:   z.number().int().min(0),
})

type Params = { params: { taskId: string } }

export async function PATCH(req: NextRequest, { params }: Params) {
  return withAuth(req, async (user) => {
    const { data, error } = await parseBody(req, moveSchema)
    if (error) return error

    try {
      // Verificar acceso
      const task = await db.task.findFirst({
        where: {
          id:     params.taskId,
          column: { board: { team: { members: { some: { userId: user.sub } } } } },
        },
        include: { column: { select: { id: true, boardId: true } } },
      })
      if (!task) return notFound()

      const fromColumnId = task.columnId
      const boardId      = task.column.boardId

      // Transacción: reordenar tareas afectadas + mover la tarea
      await db.$transaction(async (tx) => {
        // Si cambió de columna: compactar posiciones en columna destino
        if (fromColumnId !== data.toColumnId) {
          // Liberar espacio en columna destino desplazando hacia abajo
          await tx.task.updateMany({
            where: { columnId: data.toColumnId, position: { gte: data.position } },
            data:  { position: { increment: 1 } },
          })
          // Cerrar hueco en columna origen
          await tx.task.updateMany({
            where: { columnId: fromColumnId, position: { gt: task.position } },
            data:  { position: { decrement: 1 } },
          })
        } else {
          // Reordenar dentro de la misma columna
          if (data.position < task.position) {
            await tx.task.updateMany({
              where: {
                columnId: fromColumnId,
                position: { gte: data.position, lt: task.position },
                id:       { not: task.id },
              },
              data: { position: { increment: 1 } },
            })
          } else {
            await tx.task.updateMany({
              where: {
                columnId: fromColumnId,
                position: { gt: task.position, lte: data.position },
                id:       { not: task.id },
              },
              data: { position: { decrement: 1 } },
            })
          }
        }

        // Mover la tarea
        await tx.task.update({
          where: { id: task.id },
          data:  { columnId: data.toColumnId, position: data.position },
        })
      })

      await invalidateCache(CACHE_KEYS.board(boardId))

      // Emitir evento tiempo real
      emitToBoard(boardId, 'task:moved', {
        taskId:      task.id,
        fromColumnId,
        toColumnId:  data.toColumnId,
        position:    data.position,
      })

      return ok({ message: 'Tarea movida', taskId: task.id, toColumnId: data.toColumnId })
    } catch {
      return serverError()
    }
  })
}
