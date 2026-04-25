// =============================================================
//  app/api/boards/[boardId]/route.ts
// =============================================================

import type { NextRequest } from 'next/server'

import { withAuth, ok, notFound, serverError } from '@/lib/api/helpers'
import { db } from '@/lib/db'
import { withCache, invalidateCache, CACHE_KEYS, TTL } from '@/lib/redis'

type Params = { params: { boardId: string } }

// ── GET /api/boards/:id — Tablero completo con columnas y tareas ─
export async function GET(req: NextRequest, { params }: Params) {
  return withAuth(req, async (user) => {
    const { boardId } = params

    try {
      const board = await withCache(
        CACHE_KEYS.board(boardId),
        async () =>
          db.board.findFirst({
            where: {
              id:         boardId,
              isArchived: false,
              team: { members: { some: { userId: user.sub } } },
            },
            include: {
              team: {
                select: { id: true, name: true },
                include: {
                  members: {
                    select: {
                      teamRole: true,
                      user: { select: { id: true, name: true, avatarUrl: true, email: true } },
                    },
                  },
                },
              },
              columns: {
                where:   { },
                orderBy: { position: 'asc' },
                include: {
                  tasks: {
                    orderBy: { position: 'asc' },
                    include: {
                      creator:  { select: { id: true, name: true, avatarUrl: true } },
                      assignee: { select: { id: true, name: true, avatarUrl: true } },
                      labels:   { include: { label: true } },
                      _count:   { select: { comments: true } },
                    },
                  },
                },
              },
            },
          }),
        TTL.BOARD,
      )

      if (!board) return notFound('Tablero no encontrado')
      return ok(board)
    } catch {
      return serverError()
    }
  })
}

// ── DELETE /api/boards/:id — Archivar tablero ────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  return withAuth(req, async (user) => {
    const { boardId } = params

    try {
      const board = await db.board.findFirst({
        where: {
          id:   boardId,
          team: { members: { some: { userId: user.sub, teamRole: { in: ['OWNER', 'ADMIN'] } } } },
        },
      })

      if (!board) return notFound()

      await db.board.update({ where: { id: boardId }, data: { isArchived: true } })
      await invalidateCache(CACHE_KEYS.board(boardId))

      return ok({ message: 'Tablero archivado' })
    } catch {
      return serverError()
    }
  })
}
