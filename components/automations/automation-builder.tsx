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
      <div className="mt-4 border-t border-blue-100 pt-4 dark:border-blue-900/30">
        <label
          htmlFor="days-stale"
          className="text-xs font-medium text-slate-500 dark:text-slate-400"
        >
          Días sin mover la tarea
        </label>
        <input
          id="days-stale"
          type="number"
          min={1}
          max={365}
          value={(config.daysStale as number) ?? 3}
          onChange={(e) => onChange({ type: triggerType, daysStale: Number(e.target.value) })}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
        />
      </div>
    )
  }
  if (triggerType === 'SCHEDULE') {
    return (
      <div className="mt-4 border-t border-blue-100 pt-4 dark:border-blue-900/30">
        <label
          htmlFor="cron-expression"
          className="text-xs font-medium text-slate-500 dark:text-slate-400"
        >
          Expresión Cron (ej: <code>0 9 * * 1</code> = cada lunes a las 9am)
        </label>
        <input
          id="cron-expression"
          type="text"
          placeholder="0 9 * * 1"
          value={(config.cronExpression as string) ?? ''}
          onChange={(e) => onChange({ type: triggerType, cronExpression: e.target.value })}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
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
      <div className="mt-4 border-t border-indigo-100 pt-4 dark:border-indigo-900/30">
        <label
          htmlFor="assignee-id"
          className="text-xs font-medium text-slate-500 dark:text-slate-400"
        >
          ID del usuario a asignar
        </label>
        <input
          id="assignee-id"
          type="text"
          placeholder="cuid del usuario..."
          value={(config.userId as string) ?? ''}
          onChange={(e) => onChange({ type: actionType, userId: e.target.value })}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
        />
      </div>
    )
  }
  if (actionType === 'WEBHOOK') {
    return (
      <div className="mt-4 space-y-2 border-t border-indigo-100 pt-4 dark:border-indigo-900/30">
        <label
          htmlFor="webhook-url"
          className="text-xs font-medium text-slate-500 dark:text-slate-400"
        >
          URL del Webhook
        </label>
        <input
          id="webhook-url"
          type="url"
          placeholder="https://hooks.slack.com/..."
          value={(config.url as string) ?? ''}
          onChange={(e) => onChange({ ...config, type: actionType, url: e.target.value })}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
        />
        <select
          aria-label="Método HTTP"
          value={(config.method as string) ?? 'POST'}
          onChange={(e) => onChange({ ...config, type: actionType, method: e.target.value })}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
        >
          {['POST', 'GET', 'PUT', 'PATCH'].map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>
    )
  }
  if (actionType === 'SEND_NOTIFICATION') {
    return (
      <div className="mt-4 space-y-2 border-t border-indigo-100 pt-4 dark:border-indigo-900/30">
        <input
          type="text"
          placeholder="Título de la notificación"
          aria-label="Título de la notificación"
          value={(config.title as string) ?? ''}
          onChange={(e) => onChange({ ...config, type: actionType, title: e.target.value })}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
        />
        <textarea
          placeholder="Cuerpo del mensaje..."
          aria-label="Cuerpo del mensaje de la notificación"
          rows={2}
          value={(config.body as string) ?? ''}
          onChange={(e) => onChange({ ...config, type: actionType, body: e.target.value })}
          className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
        />
        <input
          type="text"
          placeholder="ID del usuario destinatario"
          aria-label="ID del usuario destinatario"
          value={(config.userId as string) ?? ''}
          onChange={(e) => onChange({ ...config, type: actionType, userId: e.target.value })}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
        />
      </div>
    )
  }
  return null
}

interface ApiError {
  response?: {
    data?: {
      error?: string
    }
  }
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
    <div className="flex w-full flex-col items-center pb-20">
      {/* 1. Trigger node */}
      <div className="relative z-10 w-full">
        <TriggerSelector
          value={trigger}
          onChange={(v) => {
            setTrigger(v)
            setTriggerConfig({ type: v })
          }}
        />
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
          <div className="relative z-0 h-12 w-1 bg-blue-200 dark:bg-blue-900/50" />

          {/* 2. Action nodes */}
          {actions.map((action, index) => (
            <div key={index} className="flex w-full flex-col items-center">
              <div className="group relative z-10 w-full">
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
                  className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-300 opacity-0 transition-colors hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-900/20"
                  title="Eliminar acción"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="relative z-0 h-12 w-1 bg-indigo-200 dark:bg-indigo-900/50" />
            </div>
          ))}

          {/* Add action button */}
          <button
            onClick={handleAddAction}
            className="z-10 flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-white text-slate-400 shadow-sm transition-all hover:scale-110 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-indigo-900/20"
            title="Añadir paso"
          >
            <Plus className="h-6 w-6" />
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
              {(error as ApiError).response?.data?.error ?? 'Error al guardar la automatización'}
            </p>
          )}
        </>
      )}

      {/* Floating save button */}
      {trigger && actions.length > 0 && (
        <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 font-semibold text-white shadow-xl transition-all hover:bg-blue-700 hover:shadow-blue-500/30 disabled:opacity-60"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isPending ? 'Guardando...' : 'Guardar automatización'}
          </button>
        </div>
      )}
    </div>
  )
}
