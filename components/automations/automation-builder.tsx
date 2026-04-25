'use client'

import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { useCreateAutomation, type AutomationAction } from '@/hooks/use-automations'
import { ActionSelector } from './action-selector'
import { TriggerSelector } from './trigger-selector'

// ── Config sub-forms ─────────────────────────────────────────
function TriggerConfigForm({
  triggerType,
  config,
  onChange,
}: {
  triggerType: string
  config: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  if (triggerType === 'TASK_STALE') {
    return (
      <div className="mt-4 pt-4 border-t border-blue-100 dark:border-blue-900/30">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Días sin mover la tarea
        </label>
        <input
          type="number"
          min={1}
          max={365}
          value={(config.daysStale as number) ?? 3}
          onChange={(e) => onChange({ type: triggerType, daysStale: Number(e.target.value) })}
          className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
    )
  }
  if (triggerType === 'SCHEDULE') {
    return (
      <div className="mt-4 pt-4 border-t border-blue-100 dark:border-blue-900/30">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Expresión Cron (ej: <code>0 9 * * 1</code> = cada lunes a las 9am)
        </label>
        <input
          type="text"
          placeholder="0 9 * * 1"
          value={(config.cronExpression as string) ?? ''}
          onChange={(e) => onChange({ type: triggerType, cronExpression: e.target.value })}
          className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>
    )
  }
  return null
}

function ActionConfigForm({
  actionType,
  config,
  onChange,
}: {
  actionType: string
  config: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  if (actionType === 'ASSIGN_USER') {
    return (
      <div className="mt-4 pt-4 border-t border-indigo-100 dark:border-indigo-900/30">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
          ID del usuario a asignar
        </label>
        <input
          type="text"
          placeholder="cuid del usuario..."
          value={(config.userId as string) ?? ''}
          onChange={(e) => onChange({ type: actionType, userId: e.target.value })}
          className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>
    )
  }
  if (actionType === 'WEBHOOK') {
    return (
      <div className="mt-4 pt-4 border-t border-indigo-100 dark:border-indigo-900/30 space-y-2">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">URL del Webhook</label>
        <input
          type="url"
          placeholder="https://hooks.slack.com/..."
          value={(config.url as string) ?? ''}
          onChange={(e) => onChange({ ...config, type: actionType, url: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <select
          value={(config.method as string) ?? 'POST'}
          onChange={(e) => onChange({ ...config, type: actionType, method: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          {['POST', 'GET', 'PUT', 'PATCH'].map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>
    )
  }
  if (actionType === 'SEND_NOTIFICATION') {
    return (
      <div className="mt-4 pt-4 border-t border-indigo-100 dark:border-indigo-900/30 space-y-2">
        <input
          type="text"
          placeholder="Título de la notificación"
          value={(config.title as string) ?? ''}
          onChange={(e) => onChange({ ...config, type: actionType, title: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <textarea
          placeholder="Cuerpo del mensaje..."
          rows={2}
          value={(config.body as string) ?? ''}
          onChange={(e) => onChange({ ...config, type: actionType, body: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <input
          type="text"
          placeholder="ID del usuario destinatario"
          value={(config.userId as string) ?? ''}
          onChange={(e) => onChange({ ...config, type: actionType, userId: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>
    )
  }
  return null
}

// ── Main component ───────────────────────────────────────────
export function AutomationBuilder({ automationName }: { automationName: string }) {
  const [trigger, setTrigger] = useState<string | null>(null)
  const [triggerConfig, setTriggerConfig] = useState<Record<string, unknown>>({})
  const [actions, setActions] = useState<{ type: string; config: Record<string, unknown> }[]>([])

  const { mutate: save, isPending, error } = useCreateAutomation()

  const handleAddAction = () => {
    setActions([...actions, { type: '', config: {} }])
  }

  const handleRemoveAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    if (!trigger) return
    if (actions.length === 0 || actions.some((a) => !a.type)) return

    const payload: AutomationAction[] = actions.map((a, i) => ({
      actionType: a.type,
      config: a.config,
      position: i,
    }))

    save({
      name: automationName,
      triggerType: trigger,
      triggerConfig: { ...triggerConfig, type: trigger },
      actions: payload,
    })
  }

  return (
    <div className="flex flex-col items-center w-full pb-20">

      {/* 1. Trigger node */}
      <div className="w-full relative z-10">
        <TriggerSelector value={trigger} onChange={(v) => { setTrigger(v); setTriggerConfig({ type: v }) }} />
        {trigger && (
          <TriggerConfigForm
            triggerType={trigger}
            config={triggerConfig}
            onChange={setTriggerConfig}
          />
        )}
      </div>

      {trigger && (
        <>
          {/* Connector line */}
          <div className="w-1 h-12 bg-blue-200 dark:bg-blue-900/50 relative z-0" />

          {/* 2. Action nodes */}
          {actions.map((action, index) => (
            <div key={index} className="flex flex-col items-center w-full">
              <div className="w-full relative z-10 group">
                <ActionSelector
                  value={action.type}
                  onChange={(val) => {
                    const next = [...actions]
                    next[index] = { type: val, config: { type: val } }
                    setActions(next)
                  }}
                />
                <ActionConfigForm
                  actionType={action.type}
                  config={action.config}
                  onChange={(cfg) => {
                    const next = [...actions]
                    next[index] = { type: next[index]!.type ?? '', config: cfg }
                    setActions(next)
                  }}
                />
                {/* Remove action button */}
                <button
                  onClick={() => handleRemoveAction(index)}
                  className="absolute top-3 right-3 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Eliminar acción"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="w-1 h-12 bg-indigo-200 dark:bg-indigo-900/50 relative z-0" />
            </div>
          ))}

          {/* Add action button */}
          <button
            onClick={handleAddAction}
            className="w-14 h-14 rounded-full bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:scale-110 transition-all z-10 shadow-sm"
            title="Añadir paso"
          >
            <Plus className="w-6 h-6" />
          </button>

          {/* Validation hint */}
          {actions.length === 0 && (
            <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">
              Añade al menos una acción para poder guardar.
            </p>
          )}

          {/* Save error */}
          {error && (
            <p className="mt-4 text-sm text-red-500">
              {(error as any).response?.data?.error ?? 'Error al guardar la automatización'}
            </p>
          )}
        </>
      )}

      {/* Floating save button */}
      {trigger && actions.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-full font-semibold shadow-xl hover:shadow-blue-500/30 transition-all"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isPending ? 'Guardando...' : 'Guardar automatización'}
          </button>
        </div>
      )}

    </div>
  )
}

