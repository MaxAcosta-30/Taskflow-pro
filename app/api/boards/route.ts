// =============================================================
//  app/api/boards/route.ts — GET /api/boards | POST /api/boards
// =============================================================

import type { NextRequest } from 'next/server'

import { withAuth, parseBody, ok, created, serverError } from '@/lib/api/helpers'
import { db } from '@/lib/db'
import { invalidateCacheByPattern } from '@/lib/redis'
import { createBoardSchema } from '@/lib/validations'

// ── GET /api/boards — Listar tableros del equipo ──────────────
export async function GET(req: NextRequest) {
  return withAuth(req, async (user) => {
    try {
      // Obtener todos los boards donde el usuario es miembro del team
      const boards = await db.board.findMany({
        where: {
          isArchived: false,
          team: {
            members: { some: { userId: user.sub } },
          },
        },
        include: {
          team: { select: { id: true, name: true, slug: true } },
          _count: { select: { columns: true } },
        },
        orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
      })

      return ok(boards)
    } catch (error) {
      return serverError()
    }
  })
}

// ── POST /api/boards — Crear tablero ──────────────────────────
export async function POST(req: NextRequest) {
  return withAuth(req, async (user) => {
    const { data, error } = await parseBody(req, createBoardSchema)
    if (error) return error

    try {
      // Obtener el equipo del usuario (primer team activo)
      const membership = await db.teamMember.findFirst({
        where: { userId: user.sub, teamRole: { in: ['OWNER', 'ADMIN'] } },
        select: { teamId: true },
      })

      if (!membership) {
        return Response.json(
          { success: false, error: 'Necesitas ser admin de un equipo para crear tableros' },
          { status: 403 },
        )
      }

      // Calcular posición
      const lastBoard = await db.board.findFirst({
        where:   { teamId: membership.teamId },
        orderBy: { position: 'desc' },
        select:  { position: true },
      })

      const board = await db.board.create({
        data: {
          ...data,
          teamId:   membership.teamId,
          position: (lastBoard?.position ?? -1) + 1,
        },
        include: {
          team:   { select: { id: true, name: true } },
          _count: { select: { columns: true } },
        },
      })

      // Crear columnas por defecto
      await db.column.createMany({
        data: [
          { boardId: board.id, name: 'Por hacer',    color: '#6B7280', position: 0, isDefault: true },
          { boardId: board.id, name: 'En progreso',  color: '#3B82F6', position: 1 },
          { boardId: board.id, name: 'En revisión',  color: '#F59E0B', position: 2 },
          { boardId: board.id, name: 'Completado',   color: '#10B981', position: 3 },
        ],
      })

      await invalidateCacheByPattern(`team:${membership.teamId}:boards`)

      return created(board)
    } catch (error) {
      return serverError()
    }
  })
}
