// =============================================================
//  components/shared/sidebar.tsx
// =============================================================

'use client'

import {
  LayoutDashboard,
  Zap,
  BarChart3,
  Settings,
  Plus,
  ChevronDown,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { useBoards, useCreateBoard } from '@/hooks/use-board'
import { useAuthStore } from '@/stores/auth.store'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Inicio', href: '/' },
  { icon: Zap, label: 'Automatizaciones', href: '/automations' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics' },
  { icon: Settings, label: 'Configuración', href: '/settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const { data: boards, isLoading } = useBoards()
  const { mutate: createBoard, isPending: creating } = useCreateBoard()
  const [boardsOpen, setBoardsOpen] = useState(true)

  return (
    <aside className="flex h-full w-60 flex-shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-slate-200 px-4 dark:border-slate-800">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600">
          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <span className="text-sm font-semibold text-slate-900 dark:text-white">TaskFlow Pro</span>
      </div>

      {/* Navegación principal */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}

        {/* Sección Tableros */}
        <div className="pt-4">
          <button
            onClick={() => setBoardsOpen((o) => !o)}
            className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          >
            <span>Tableros</span>
            {boardsOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>

          {boardsOpen && (
            <div className="mt-1 space-y-0.5">
              {isLoading && (
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Cargando...</span>
                </div>
              )}

              {boards?.map((board) => {
                const active = pathname === `/board/${board.id}`
                return (
                  <Link
                    key={board.id}
                    href={`/board/${board.id}`}
                    className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                      active
                        ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: board.color }}
                    />
                    <span className="truncate">{board.name}</span>
                  </Link>
                )
              })}

              {/* Crear nuevo tablero */}
              <button
                onClick={() => createBoard({ name: 'Nuevo tablero', color: '#3B82F6' })}
                disabled={creating}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800/50 dark:hover:text-slate-300"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>Nuevo tablero</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Usuario */}
      <div className="border-t border-slate-200 p-3 dark:border-slate-800">
        <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-slate-900 dark:text-white">
              {user?.name}
            </p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
