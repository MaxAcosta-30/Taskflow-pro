// =============================================================
//  app/(dashboard)/automations/builder/page.tsx — El Builder Visual
// =============================================================

'use client'

import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { AutomationBuilder } from '@/components/automations/automation-builder'

export default function AutomationBuilderPage() {
  const [name, setName] = useState('Nueva Automatización Sin Título')

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] -m-6 bg-slate-50/50 dark:bg-slate-950/50">
      {/* Builder Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Link
            href="/automations"
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <input 
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-lg font-semibold bg-transparent border-none outline-none focus:ring-0 text-slate-900 dark:text-white placeholder-slate-300 w-80"
            placeholder="Nombre de la automatización..."
          />
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            Descartar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm">
            <Save className="w-4 h-4" />
            Guardar Flujo
          </button>
        </div>
      </div>

      {/* Builder Canvas */}
      <div className="flex-1 overflow-y-auto p-8 relative">
        {/* Patrón de puntos de fondo */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        
        <div className="max-w-2xl mx-auto relative z-10 py-10">
          <AutomationBuilder />
        </div>
      </div>
    </div>
  )
}
