// =============================================================
//  components/shared/topbar.tsx
// =============================================================

'use client'

import { Bell, LogOut, User } from 'lucide-react'
import { useState } from 'react'

import { useLogout } from '@/hooks/use-auth'
import { useAuthStore } from '@/stores/auth.store'

export function TopBar() {
  const { user } = useAuthStore()
  const { mutate: logout, isPending: loggingOut } = useLogout()
  const [notifOpen, setNotifOpen] = useState(false)

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-900">
      {/* Breadcrumb / título (slot vacío — cada página lo llena) */}
      <div id="topbar-title" />

      {/* Acciones */}
      <div className="flex items-center gap-2">
        {/* Notificaciones */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <Bell className="h-4 w-4" />
            {/* Badge */}
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>

          {notifOpen && (
            <div className="animate-fade-in absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
              <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Notificaciones
                </p>
              </div>
              <div className="p-8 text-center text-sm text-slate-400">
                No tienes notificaciones nuevas
              </div>
            </div>
          )}
        </div>

        {/* Perfil + logout */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-2 dark:border-slate-800">
          <div className="h-8 w-8 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            )}
          </div>

          <button
            onClick={() => logout()}
            disabled={loggingOut}
            title="Cerrar sesión"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
