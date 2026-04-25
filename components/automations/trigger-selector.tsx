'use client'

import { Zap, Clock, Cloud, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

const TRIGGERS = [
  { id: 'TASK_MOVED', icon: ArrowRight, title: 'Tarea movida', desc: 'Cuando una tarea se mueve a una columna específica' },
  { id: 'TASK_STALE', icon: Clock, title: 'Tarea estancada', desc: 'Cuando una tarea no se ha movido en N días' },
  { id: 'WEATHER', icon: Cloud, title: 'Condición climática', desc: 'Cuando el clima cambia en tu ubicación' },
  { id: 'SCHEDULE', icon: Clock, title: 'Cronograma programado', desc: 'Se ejecuta periódicamente (Cron)' },
]

export function TriggerSelector({ value, onChange }: { value: string | null, onChange: (v: string) => void }) {
  const [isOpen, setIsOpen] = useState(!value)

  const selected = TRIGGERS.find(t => t.id === value)
  const Icon = selected?.icon || Zap

  if (!isOpen && selected) {
    return (
      <div 
        onClick={() => setIsOpen(true)}
        className="bg-white dark:bg-slate-900 border-2 border-blue-500 rounded-xl p-5 shadow-sm cursor-pointer hover:shadow-md transition-all group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-0.5">1. Desencadenante</p>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selected.title}</h3>
            </div>
          </div>
          <CheckCircle2 className="w-6 h-6 text-blue-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 shadow-sm relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/5 blur-2xl rounded-full" />

      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Elige un Desencadenante</h3>
          <p className="text-sm text-slate-500">¿Qué evento iniciará esta automatización?</p>
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        {TRIGGERS.map((trigger) => (
          <button
            key={trigger.id}
            onClick={() => { onChange(trigger.id); setIsOpen(false) }}
            className="w-full flex items-start gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:bg-white dark:group-hover:bg-slate-900 transition-colors shrink-0 shadow-sm">
              <trigger.icon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">{trigger.title}</h4>
              <p className="text-sm text-slate-500 mt-0.5">{trigger.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
