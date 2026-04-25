// =============================================================
//  app/(dashboard)/page.tsx — Dashboard Home
// =============================================================

'use client'

import { Plus, Layout, Loader2 } from 'lucide-react'
import Link            from 'next/link'

import { useBoards, useCreateBoard } from '@/hooks/use-board'
import { useAuthStore }              from '@/stores/auth.store'

export default function HomePage() {
  const { user }                               = useAuthStore()
  const { data: boards, isLoading }            = useBoards()
  const { mutate: createBoard, isPending }     = useCreateBoard()

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Hola, {user?.name?.split(' ')[0]} 
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Aquí tienes un resumen de tus tableros activos.
        </p>
      </div>

      {/* Grid de tableros */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
          Mis tableros
        </h2>

        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Cargando tableros...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards?.map((board) => (
              <Link
                key={board.id}
                href={`/board/${board.id}`}
                className="group relative bg-white dark:bg-slate-900
                           border border-slate-200 dark:border-slate-700
                           rounded-xl p-5 hover:shadow-md transition-all duration-200
                           hover:border-slate-300 dark:hover:border-slate-600"
              >
                {/* Color strip */}
                <div
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                  style={{ backgroundColor: board.color }}
                />

                <div className="flex items-start justify-between mt-1">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${board.color}20` }}
                    >
                      <Layout className="w-4 h-4" style={{ color: board.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {board.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
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
              className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl
                         border-2 border-dashed border-slate-200 dark:border-slate-700
                         text-slate-400 hover:text-slate-600 dark:hover:text-slate-300
                         hover:border-slate-300 dark:hover:border-slate-600
                         hover:bg-slate-50 dark:hover:bg-slate-800/50
                         transition-all min-h-[96px]"
            >
              {isPending
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <Plus className="w-5 h-5" />
              }
              <span className="text-sm font-medium">Nuevo tablero</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
