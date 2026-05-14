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
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">
            <Zap className="h-6 w-6 text-yellow-500" />
            Automatizaciones
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Diseña flujos de trabajo en segundo plano para ahorrar tiempo.
          </p>
        </div>

        <Link
          href="/automations/builder"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nueva Automatización
        </Link>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          Cargando automatizaciones...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="py-12 text-center text-red-500">
          No se pudieron cargar las automatizaciones.
        </div>
      )}

      {/* Empty state */}
      {!isLoading && automations?.length === 0 && (
        <div className="space-y-4 py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <Zap className="h-8 w-8 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-slate-500 dark:text-slate-400">
            Aún no tienes automatizaciones.{' '}
            <Link href="/automations/builder" className="font-medium text-blue-500 hover:underline">
              Crea tu primera
            </Link>
          </p>
        </div>
      )}

      {/* Grid */}
      {automations && automations.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {automations.map((auto) => (
            <div
              key={auto.id}
              className="group relative rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${auto.isActive ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-500' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}
                  >
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {auto.name}
                    </h3>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${auto.isActive ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                      />
                      <span className="text-xs font-medium text-slate-500">
                        {auto.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Context menu */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === auto.id ? null : auto.id)}
                    className="rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    aria-label="Opciones de automatización"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {menuOpen === auto.id && (
                    <div
                      className="absolute right-0 top-8 z-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800"
                      onMouseLeave={() => setMenuOpen(null)}
                    >
                      <button
                        onClick={() => {
                          toggle({ id: auto.id, isActive: !auto.isActive })
                          setMenuOpen(null)
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/50"
                      >
                        <Power className="h-4 w-4" />
                        {auto.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => {
                          remove(auto.id)
                          setMenuOpen(null)
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {auto.description && (
                <p className="mt-4 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                  {auto.description}
                </p>
              )}

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5" />
                  <span>{TRIGGER_LABELS[auto.triggerType] ?? auto.triggerType}</span>
                </div>

                {auto.lastRunAt ? (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {formatDistanceToNow(new Date(auto.lastRunAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-300 dark:text-slate-600">Nunca ejecutado</span>
                )}
              </div>

              {/* Run count badge */}
              <div className="absolute right-10 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
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
