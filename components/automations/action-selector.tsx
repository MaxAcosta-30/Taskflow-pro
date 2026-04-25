'use client'

import { Activity, Webhook, UserPlus, Tag, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

const ACTIONS = [
  { id: 'ASSIGN_USER', icon: UserPlus, title: 'Asignar a un usuario', desc: 'Asigna la tarea a un miembro específico del equipo' },
  { id: 'ADD_LABEL', icon: Tag, title: 'Añadir etiqueta', desc: 'Añade una etiqueta de color a la tarea automáticamente' },
  { id: 'WEBHOOK', icon: Webhook, title: 'Llamar a un Webhook', desc: 'Envía los datos mediante una petición HTTP POST a una URL externa' },
]

export function ActionSelector({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  const [isOpen, setIsOpen] = useState(!value)

  const selected = ACTIONS.find(a => a.id === value)
  const Icon = selected?.icon || Activity

  if (!isOpen && selected) {
    return (
      <div 
        onClick={() => setIsOpen(true)}
        className="bg-white dark:bg-slate-900 border-2 border-indigo-500 rounded-xl p-5 shadow-sm cursor-pointer hover:shadow-md transition-all group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-0.5">Acción</p>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selected.title}</h3>
            </div>
          </div>
          <CheckCircle2 className="w-6 h-6 text-indigo-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 shadow-sm relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/5 blur-2xl rounded-full" />

      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Añadir una Acción</h3>
          <p className="text-sm text-slate-500">¿Qué debe hacer el sistema a continuación?</p>
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        {ACTIONS.map((action) => (
          <button
            key={action.id}
            onClick={() => { onChange(action.id); setIsOpen(false) }}
            className="w-full flex items-start gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:bg-white dark:group-hover:bg-slate-900 transition-colors shrink-0 shadow-sm">
              <action.icon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">{action.title}</h4>
              <p className="text-sm text-slate-500 mt-0.5">{action.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
