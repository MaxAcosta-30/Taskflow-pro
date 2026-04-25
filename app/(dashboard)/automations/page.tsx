// =============================================================
//  app/(dashboard)/automations/page.tsx — Listado de automatizaciones
// =============================================================

'use client'

import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Activity, Clock, Loader2, MoreVertical, Plus, Power, Trash2, Zap } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { useAutomations, useDeleteAutomation, useToggleAutomation } from '@/hooks/use-automations'

const TRIGGER_LABELS: Record<string, string> = {
  TASK_STALE: 'Tarea estancada',
  TASK_MOVED: 'Tarea movida',
  TASK_ASSIGNED: 'Tarea asignada',
  TASK_DUE_SOON: 'Próxima a vencer',
  SCHEDULE: 'Programada',
  WEATHER: 'Clima',
  WEBHOOK: 'Webhook entrante',
}

export default function AutomationsPage() {
  const { data: automations, isLoading, error } = useAutomations()
  const { mutate: toggle } = useToggleAutomation()
  const { mutate: remove } = useDeleteAutomation()

  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            Automatizaciones
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Diseña flujos de trabajo en segundo plano para ahorrar tiempo.
          </p>
        </div>

        <Link
          href="/automations/builder"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Automatización
        </Link>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Cargando automatizaciones...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-12 text-red-500">
          No se pudieron cargar las automatizaciones.
        </div>
      )}

      {/* Empty state */}
      {!isLoading && automations?.length === 0 && (
        <div className="text-center py-20 space-y-4">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto">
            <Zap className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-slate-500 dark:text-slate-400">
            Aún no tienes automatizaciones.{' '}
            <Link href="/automations/builder" className="text-blue-500 hover:underline font-medium">
              Crea tu primera
            </Link>
          </p>
        </div>
      )}

      {/* Grid */}
      {automations && automations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {automations.map((auto) => (
            <div
              key={auto.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:shadow-md transition-shadow relative group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${auto.isActive ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-500' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                      {auto.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`w-2 h-2 rounded-full ${auto.isActive ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                      <span className="text-xs text-slate-500 font-medium">
                        {auto.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Context menu */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === auto.id ? null : auto.id)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {menuOpen === auto.id && (
                    <div
                      className="absolute right-0 top-8 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden"
                      onMouseLeave={() => setMenuOpen(null)}
                    >
                      <button
                        onClick={() => { toggle({ id: auto.id, isActive: !auto.isActive }); setMenuOpen(null) }}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <Power className="w-4 h-4" />
                        {auto.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => { remove(auto.id); setMenuOpen(null) }}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {auto.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 line-clamp-2">
                  {auto.description}
                </p>
              )}

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>{TRIGGER_LABELS[auto.triggerType] ?? auto.triggerType}</span>
                </div>

                {auto.lastRunAt ? (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {formatDistanceToNow(new Date(auto.lastRunAt), { addSuffix: true, locale: es })}
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-300 dark:text-slate-600">Nunca ejecutado</span>
                )}
              </div>

              {/* Run count badge */}
              <div className="absolute top-3 right-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
                  {auto._count.runs} ejecuciones
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

