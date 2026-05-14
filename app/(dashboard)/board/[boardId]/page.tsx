// =============================================================
//  app/(dashboard)/board/[boardId]/page.tsx — Kanban Board
// =============================================================

'use client'

import { Loader2, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { useParams } from 'next/navigation'

import { KanbanBoard } from '@/components/board/kanban-board'
import { useBoard } from '@/hooks/use-board'
import { useBoardSocket } from '@/hooks/use-socket'

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>()

  const { data: board, isLoading, isError } = useBoard(boardId)
  useBoardSocket(boardId)

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-sm">Cargando tablero...</span>
        </div>
      </div>
    )
  }

  if (isError || !board) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <span className="text-sm">No se pudo cargar el tablero</span>
        </div>
      </div>
    )
  }

  return (
    <div className="-m-6 flex h-full flex-col">
      {/* Header del tablero */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: board.color }} />
          <h1 className="font-semibold text-slate-900 dark:text-white">{board.name}</h1>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400 dark:bg-slate-800">
            {board.team.name}
          </span>
        </div>

        {/* Avatares de miembros del equipo */}
        <div className="flex items-center -space-x-2">
          {board.team.members.slice(0, 5).map(({ user }) => (
            <div
              key={user.id}
              title={user.name}
              className="relative h-7 w-7 overflow-hidden rounded-full border-2 border-white bg-blue-100 dark:border-slate-900 dark:bg-blue-900"
            >
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.name}
                  fill
                  className="object-cover"
                  sizes="28px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                    {user.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          ))}
          {board.team.members.length > 5 && (
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-200 dark:border-slate-900 dark:bg-slate-700">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                +{board.team.members.length - 5}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tablero Kanban */}
      <div className="flex-1 overflow-hidden px-6 py-4">
        <KanbanBoard board={board} />
      </div>
    </div>
  )
}
