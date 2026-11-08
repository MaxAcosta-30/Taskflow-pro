// =============================================================
//  app/(dashboard)/page.tsx — Dashboard Home
// =============================================================

'use client'

import { Plus, Loader2 } from 'lucide-react'
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
                className="group relative flex min-h-[112px] flex-col justify-between rounded-md border border-slate-200 bg-card p-5 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-500"
              >
                {/* El color del tablero es un punto, igual que en la barra lateral */}
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: board.color }}
                    aria-hidden="true"
                  />
                  <h3 className="truncate text-base font-bold text-slate-900 dark:text-white">
                    {board.name}
                  </h3>
                </div>
                <p className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                  <span>{board._count.columns} columnas</span>
                  <span className="font-medium text-slate-700 group-hover:text-primary dark:text-slate-300">
                    Abrir tablero
                  </span>
                </p>
              </Link>
            ))}

            {/* Crear nuevo tablero */}
            <button
              onClick={() => createBoard({ name: 'Nuevo tablero', color: '#FFC931' })}
              disabled={isPending}
              className="flex min-h-[112px] flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-slate-200 p-5 text-slate-400 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800/50 dark:hover:text-slate-300"
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
