'use client'

import { Activity, Webhook, UserPlus, Tag, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

const ACTIONS = [
  {
    id: 'ASSIGN_USER',
    icon: UserPlus,
    title: 'Asignar a un usuario',
    desc: 'Asigna la tarea a un miembro específico del equipo',
  },
  {
    id: 'ADD_LABEL',
    icon: Tag,
    title: 'Añadir etiqueta',
    desc: 'Añade una etiqueta de color a la tarea automáticamente',
  },
  {
    id: 'WEBHOOK',
    icon: Webhook,
    title: 'Llamar a un Webhook',
    desc: 'Envía los datos mediante una petición HTTP POST a una URL externa',
  },
]

export function ActionSelector({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [isOpen, setIsOpen] = useState(!value)

  const selected = ACTIONS.find((a) => a.id === value)
  const Icon = selected?.icon || Activity

  if (!isOpen && selected) {
    return (
      <div
        onClick={() => setIsOpen(true)}
        className="group cursor-pointer rounded-xl border-2 border-indigo-500 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-slate-900"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 transition-transform group-hover:scale-105 dark:bg-indigo-900/30 dark:text-indigo-400">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="mb-0.5 text-xs font-bold uppercase tracking-wider text-indigo-500">
                Acción
              </p>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selected.title}</h3>
            </div>
          </div>
          <CheckCircle2 className="h-6 w-6 text-indigo-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      {/* Decorative background glow */}
      <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl dark:bg-indigo-500/5" />

      <div className="relative z-10 mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Añadir una Acción</h3>
          <p className="text-sm text-slate-500">¿Qué debe hacer el sistema a continuación?</p>
        </div>
      </div>

      <div className="relative z-10 space-y-3">
        {ACTIONS.map((action) => (
          <button
            key={action.id}
            onClick={() => {
              onChange(action.id)
              setIsOpen(false)
            }}
            className="group flex w-full items-start gap-4 rounded-xl border border-slate-200 p-4 text-left transition-all hover:border-indigo-500 hover:bg-indigo-50 dark:border-slate-800 dark:hover:bg-indigo-900/20"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 shadow-sm transition-colors group-hover:bg-white group-hover:text-indigo-600 dark:bg-slate-800 dark:group-hover:bg-slate-900 dark:group-hover:text-indigo-400">
              <action.icon className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 transition-colors group-hover:text-indigo-700 dark:text-white dark:group-hover:text-indigo-300">
                {action.title}
              </h4>
              <p className="mt-0.5 text-sm text-slate-500">{action.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
