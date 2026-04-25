// =============================================================
//  components/shared/topbar.tsx
// =============================================================

'use client'

import { Bell, LogOut, User } from 'lucide-react'
import { useState }     from 'react'

import { useLogout }    from '@/hooks/use-auth'
import { useAuthStore } from '@/stores/auth.store'

export function TopBar() {
  const { user }                                = useAuthStore()
  const { mutate: logout, isPending: loggingOut } = useLogout()
  const [notifOpen, setNotifOpen]               = useState(false)

  return (
    <header className="h-14 flex items-center justify-between px-6
                       bg-white dark:bg-slate-900
                       border-b border-slate-200 dark:border-slate-800">
      {/* Breadcrumb / título (slot vacío — cada página lo llena) */}
      <div id="topbar-title" />

      {/* Acciones */}
      <div className="flex items-center gap-2">
        {/* Notificaciones */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400
                       hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {/* Badge */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900
                            border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg
                            z-50 overflow-hidden animate-fade-in">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Notificaciones</p>
              </div>
              <div className="p-8 text-center text-sm text-slate-400">
                No tienes notificaciones nuevas
              </div>
            </div>
          )}
        </div>

        {/* Perfil + logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 overflow-hidden">
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
            }
          </div>

          <button
            onClick={() => logout()}
            disabled={loggingOut}
            title="Cerrar sesión"
            className="p-2 rounded-lg text-slate-400 hover:text-red-500
                       hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
