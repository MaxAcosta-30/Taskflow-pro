// =============================================================
//  app/(dashboard)/board/[boardId]/page.tsx — Kanban Board
// =============================================================

'use client'

import { Loader2, AlertCircle } from 'lucide-react'
import { useParams }       from 'next/navigation'

import { KanbanBoard }     from '@/components/board/kanban-board'
import { useBoard }        from '@/hooks/use-board'
import { useBoardSocket }  from '@/hooks/use-socket'

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>()

  const { data: board, isLoading, isError } = useBoard(boardId)
  useBoardSocket(boardId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-sm">Cargando tablero...</span>
        </div>
      </div>
    )
  }

  if (isError || !board) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <span className="text-sm">No se pudo cargar el tablero</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Header del tablero */}
      <div className="flex items-center justify-between px-6 py-4
                      border-b border-slate-200 dark:border-slate-800
                      bg-white dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: board.color }}
          />
          <h1 className="font-semibold text-slate-900 dark:text-white">{board.name}</h1>
          <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            {board.team.name}
          </span>
        </div>

        {/* Avatares de miembros del equipo */}
        <div className="flex items-center -space-x-2">
          {board.team.members.slice(0, 5).map(({ user }) => (
            <div
              key={user.id}
              title={user.name}
              className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900
                         bg-blue-100 dark:bg-blue-900 overflow-hidden"
            >
              {user.avatarUrl
                ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                      {user.name.charAt(0)}
                    </span>
                  </div>
              }
            </div>
          ))}
          {board.team.members.length > 5 && (
            <div className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900
                            bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
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
