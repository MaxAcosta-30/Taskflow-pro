import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, parseBody, ok, notFound, serverError } from '@/lib/api/helpers';
import { createColumnSchema } from '@/lib/validations';
import { emitToBoard } from '@/lib/socket/emitter';

const updateColumnSchema = createColumnSchema.partial().omit({ boardId: true });

/**
 * PATCH /api/columns/[columnId]
 * Actualiza una columna.
 */
export async function PATCH(req: NextRequest, { params }: { params: { columnId: string } }) {
  return withAuth(req, async (user) => {
    const { data, error } = await parseBody(req, updateColumnSchema);
    if (error) return error;

    try {
      const column = await db.column.findFirst({
        where: {
          id: params.columnId,
          board: {
            team: { members: { some: { userId: user.sub } } },
          },
        },
      });

      if (!column) return notFound('Columna no encontrada');

      const updated = await db.column.update({
        where: { id: params.columnId },
        data,
      });

      emitToBoard(updated.boardId, 'column:updated', { column: updated as any, boardId: updated.boardId });

      return ok(updated);
    } catch (err: any) {
      console.error('[PATCH_COLUMN_ERROR]', err);
      return serverError();
    }
  });
}

/**
 * DELETE /api/columns/[columnId]
 * Elimina una columna y mueve sus tareas a la columna por defecto o las elimina (depende de la lógica).
 * Aquí simplemente la eliminamos (Cascade en Prisma se encarga de las tareas).
 */
export async function DELETE(req: NextRequest, { params }: { params: { columnId: string } }) {
  return withAuth(req, async (user) => {
    try {
      const column = await db.column.findFirst({
        where: {
          id: params.columnId,
          board: {
            team: { members: { some: { userId: user.sub } } },
          },
        },
      });

      if (!column) return notFound('Columna no encontrada');

      await db.column.delete({
        where: { id: params.columnId },
      });

      emitToBoard(column.boardId, 'column:deleted', { columnId: params.columnId, boardId: column.boardId });

      return ok({ message: 'Columna eliminada' });
    } catch (err: any) {
      console.error('[DELETE_COLUMN_ERROR]', err);
      return serverError();
    }
  });
}
