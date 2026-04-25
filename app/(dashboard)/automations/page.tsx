// =============================================================
//  app/(dashboard)/automations/page.tsx — Listado de automatizaciones
// =============================================================

'use client'

import { Plus, Zap, Activity, Clock, MoreVertical } from 'lucide-react'
import Link from 'next/link'

export default function AutomationsPage() {
  // Datos mockeados temporalmente para la UI visual
  const automations = [
    {
      id: 'auto_1',
      name: 'Alerta de tareas estancadas',
      description: 'Notifica al equipo si una tarea lleva más de 3 días en "In Progress".',
      isActive: true,
      triggerType: 'TASK_STALE',
      lastRunAt: new Date(Date.now() - 1000 * 60 * 30), // Hace 30 min
    },
    {
      id: 'auto_2',
      name: 'Asignación por defecto frontend',
      description: 'Asigna a Max cuando se crea una tarea con etiqueta "Frontend".',
      isActive: false,
      triggerType: 'TASK_MOVED',
      lastRunAt: null,
    }
  ]

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

      {/* Grid de automatizaciones */}
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

              <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 line-clamp-2">
              {auto.description}
            </p>

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                <span>Trigger: {auto.triggerType}</span>
              </div>
              
              {auto.lastRunAt && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Hace {Math.floor((Date.now() - auto.lastRunAt.getTime()) / 60000)} min</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
