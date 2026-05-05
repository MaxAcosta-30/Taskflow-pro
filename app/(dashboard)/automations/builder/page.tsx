// =============================================================
//  app/(dashboard)/automations/builder/page.tsx — El Builder Visual
// =============================================================

'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { AutomationBuilder } from '@/components/automations/automation-builder'

export default function AutomationBuilderPage() {
  const [name, setName] = useState('Nueva Automatización Sin Título')

  return (
    <div className="-m-6 flex h-[calc(100vh-2rem)] flex-col bg-slate-50/50 dark:bg-slate-950/50">
      {/* Builder Header */}
      <div className="z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <Link
            href="/automations"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-80 border-none bg-transparent text-lg font-semibold text-slate-900 placeholder-slate-300 outline-none focus:ring-0 dark:text-white"
            placeholder="Nombre de la automatización..."
          />
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/automations"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Descartar
          </Link>
        </div>
      </div>

      {/* Builder Canvas */}
      <div className="relative flex-1 overflow-y-auto p-8">
        {/* Patrón de puntos de fondo */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative z-10 mx-auto max-w-2xl py-10">
          <AutomationBuilder automationName={name} />
        </div>
      </div>
    </div>
  )
}
