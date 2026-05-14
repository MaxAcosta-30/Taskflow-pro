'use client'

import { User, Bell, Lock, Users, Palette } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Configuracion
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Gestiona las preferencias de tu cuenta, equipo y notificaciones.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[200px_1fr]">
        {/* Navegacion Lateral de Settings */}
        <aside className="space-y-1">
          <nav className="flex flex-col space-y-1">
            <button className="flex items-center gap-3 rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
              <User size={18} />
              Perfil
            </button>
            <button className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
              <Users size={18} />
              Equipo
            </button>
            <button className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
              <Bell size={18} />
              Notificaciones
            </button>
            <button className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
              <Palette size={18} />
              Apariencia
            </button>
            <button className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
              <Lock size={18} />
              Seguridad
            </button>
          </nav>
        </aside>

        {/* Contenido Principal */}
        <div className="space-y-6">
          {/* Seccion de Perfil */}
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-slate-500 dark:bg-slate-800">
                <User size={32} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Informacion Personal
                </h2>
                <button className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                  Cambiar foto de perfil
                </button>
              </div>
            </div>

            <form className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    placeholder="Max Power"
                    className="w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Correo Electronico
                  </label>
                  <input
                    type="email"
                    placeholder="admin@taskflow.pro"
                    className="w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="timezone"
                  className="text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Zona Horaria
                </label>
                <select
                  id="timezone"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <option>America/Mexico_City (GMT-6)</option>
                  <option>UTC</option>
                  <option>Europe/Madrid (GMT+1)</option>
                </select>
              </div>

              <div className="pt-4">
                <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </section>

          {/* Seccion de Plan de Equipo */}
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-50">
              Plan y Facturacion
            </h2>
            <div className="flex items-center justify-between rounded-md border border-blue-100 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <div>
                <p className="text-sm font-bold text-blue-900 dark:text-blue-100">Plan Pro</p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Facturacion mensual activa
                </p>
              </div>
              <button className="rounded border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-700 dark:bg-slate-800 dark:text-blue-300">
                Gestionar Plan
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
