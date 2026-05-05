'use client'

import { Zap, Clock, Cloud, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

const TRIGGERS = [
  {
    id: 'TASK_MOVED',
    icon: ArrowRight,
    title: 'Tarea movida',
    desc: 'Cuando una tarea se mueve a una columna específica',
  },
  {
    id: 'TASK_STALE',
    icon: Clock,
    title: 'Tarea estancada',
    desc: 'Cuando una tarea no se ha movido en N días',
  },
  {
    id: 'WEATHER',
    icon: Cloud,
    title: 'Condición climática',
    desc: 'Cuando el clima cambia en tu ubicación',
  },
  {
    id: 'SCHEDULE',
    icon: Clock,
    title: 'Cronograma programado',
    desc: 'Se ejecuta periódicamente (Cron)',
  },
]

export function TriggerSelector({
  value,
  onChange,
}: {
  value: string | null
  onChange: (v: string) => void
}) {
  const [isOpen, setIsOpen] = useState(!value)

  const selected = TRIGGERS.find((t) => t.id === value)
  const Icon = selected?.icon || Zap

  if (!isOpen && selected) {
    return (
      <div
        onClick={() => setIsOpen(true)}
        className="group cursor-pointer rounded-xl border-2 border-blue-500 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-slate-900"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition-transform group-hover:scale-105 dark:bg-blue-900/30 dark:text-blue-400">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="mb-0.5 text-xs font-bold uppercase tracking-wider text-blue-500">
                1. Desencadenante
              </p>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selected.title}</h3>
            </div>
          </div>
          <CheckCircle2 className="h-6 w-6 text-blue-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      {/* Decorative background glow */}
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl dark:bg-blue-500/5" />

      <div className="relative z-10 mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Elige un Desencadenante
          </h3>
          <p className="text-sm text-slate-500">¿Qué evento iniciará esta automatización?</p>
        </div>
      </div>

      <div className="relative z-10 space-y-3">
        {TRIGGERS.map((trigger) => (
          <button
            key={trigger.id}
            onClick={() => {
              onChange(trigger.id)
              setIsOpen(false)
            }}
            className="group flex w-full items-start gap-4 rounded-xl border border-slate-200 p-4 text-left transition-all hover:border-blue-500 hover:bg-blue-50 dark:border-slate-800 dark:hover:bg-blue-900/20"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 shadow-sm transition-colors group-hover:bg-white group-hover:text-blue-600 dark:bg-slate-800 dark:group-hover:bg-slate-900 dark:group-hover:text-blue-400">
              <trigger.icon className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 transition-colors group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
                {trigger.title}
              </h4>
              <p className="mt-0.5 text-sm text-slate-500">{trigger.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
