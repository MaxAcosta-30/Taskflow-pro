// =============================================================
//  app/(dashboard)/page.tsx — Dashboard Home
// =============================================================

'use client'

import { Plus, Layout, Loader2 } from 'lucide-react'
import Link from 'next/link'

import { useBoards, useCreateBoard } from '@/hooks/use-board'
import { useAuthStore } from '@/stores/auth.store'

export default function HomePage() {
  const { user } = useAuthStore()
  const { data: boards, isLoading } = useBoards()
  const { mutate: createBoard, isPending } = useCreateBoard()

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Hola, {user?.name?.split(' ')[0]}
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Aquí tienes un resumen de tus tableros activos.
        </p>
      </div>

      {/* Grid de tableros */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Mis tableros
        </h2>

        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Cargando tableros...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {boards?.map((board) => (
              <Link
                key={board.id}
                href={`/board/${board.id}`}
                className="group relative rounded-xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
              >
                {/* Color strip */}
                <div
                  className="absolute left-0 right-0 top-0 h-1 rounded-t-xl"
                  style={{ backgroundColor: board.color }}
                />

                <div className="mt-1 flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${board.color}20` }}
                    >
                      <Layout className="h-4 w-4" style={{ color: board.color }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                        {board.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {board._count.columns} columnas
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {/* Crear nuevo tablero */}
            <button
              onClick={() => createBoard({ name: 'Nuevo tablero', color: '#3B82F6' })}
              disabled={isPending}
              className="flex min-h-[96px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 p-5 text-slate-400 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800/50 dark:hover:text-slate-300"
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
              <span className="text-sm font-medium">Nuevo tablero</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
