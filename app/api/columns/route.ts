import type { NextRequest } from 'next/server'

import { withAuth, parseBody, created, serverError } from '@/lib/api/helpers'
import { db } from '@/lib/db'
import { publishToBoard } from '@/lib/socket/publisher'
import { createColumnSchema } from '@/lib/validations'

/**
 * POST /api/columns
 * Agrega una nueva columna a un tablero.
 */
export async function POST(req: NextRequest) {
  return withAuth(req, async (user) => {
    const { data, error } = await parseBody(req, createColumnSchema)
    if (error) return error

    try {
      // Verificar que el usuario tenga acceso al tablero
      const board = await db.board.findFirst({
        where: {
          id: data.boardId,
          team: {
            members: { some: { userId: user.sub } },
          },
        },
      })

      if (!board) {
        return Response.json(
          { success: false, error: 'Tablero no encontrado o sin acceso' },
          { status: 404 },
        )
      }

      // Obtener la última posición
      const lastColumn = await db.column.findFirst({
        where: { boardId: data.boardId },
        orderBy: { position: 'desc' },
      })

      const position = data.position ?? (lastColumn ? lastColumn.position + 1 : 0)

      const column = await db.column.create({
        data: {
          boardId: data.boardId,
          name: data.name,
          color: data.color || '#6B7280',
          position,
        },
      })

      // Notificar vía WebSockets
      await publishToBoard(data.boardId, 'column:created', {
        column: column as never,
        boardId: data.boardId,
      })

      return created(column)
    } catch (err: unknown) {
      console.error('[POST_COLUMN_ERROR]', err)
      return serverError()
    }
  })
}
