// =============================================================
//  components/shared/sidebar.tsx
// =============================================================

'use client'

import {
  LayoutDashboard, Zap, BarChart3, Settings,
  Plus, ChevronDown, ChevronRight, Loader2,
} from 'lucide-react'
import Link              from 'next/link'
import { usePathname }   from 'next/navigation'
import { useState }      from 'react'

import { useBoards, useCreateBoard } from '@/hooks/use-board'
import { useAuthStore }              from '@/stores/auth.store'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Inicio',          href: '/' },
  { icon: Zap,             label: 'Automatizaciones', href: '/automations' },
  { icon: BarChart3,       label: 'Analytics',        href: '/analytics' },
  { icon: Settings,        label: 'Configuración',    href: '/settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const { data: boards, isLoading } = useBoards()
  const { mutate: createBoard, isPending: creating } = useCreateBoard()
  const [boardsOpen, setBoardsOpen] = useState(true)

  return (
    <aside className="w-60 flex-shrink-0 bg-white dark:bg-slate-900
                      border-r border-slate-200 dark:border-slate-800
                      flex flex-col h-full">

      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-slate-200 dark:border-slate-800">
        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="font-semibold text-slate-900 dark:text-white text-sm">TaskFlow Pro</span>
      </div>

      {/* Navegación principal */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${active
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}

        {/* Sección Tableros */}
        <div className="pt-4">
          <button
            onClick={() => setBoardsOpen((o) => !o)}
            className="w-full flex items-center justify-between px-3 py-1.5
                       text-xs font-semibold uppercase tracking-wider
                       text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <span>Tableros</span>
            {boardsOpen
              ? <ChevronDown className="w-3 h-3" />
              : <ChevronRight className="w-3 h-3" />
            }
          </button>

          {boardsOpen && (
            <div className="mt-1 space-y-0.5">
              {isLoading && (
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Cargando...</span>
                </div>
              )}

              {boards?.map((board) => {
                const active = pathname === `/board/${board.id}`
                return (
                  <Link
                    key={board.id}
                    href={`/board/${board.id}`}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors
                      ${active
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
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
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm
                           text-slate-400 dark:text-slate-500
                           hover:bg-slate-50 dark:hover:bg-slate-800/50
                           hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                {creating
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Plus className="w-4 h-4" />
                }
                <span>Nuevo tablero</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Usuario */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md">
          <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              : <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
            }
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
