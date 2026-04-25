'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'

import { ActionSelector }  from './action-selector'
import { TriggerSelector } from './trigger-selector'

export function AutomationBuilder() {
  const [trigger, setTrigger] = useState<string | null>(null)
  // Las acciones empiezan vacías hasta que el usuario decida añadir un paso
  const [actions, setActions] = useState<string[]>([])

  const handleAddAction = () => {
    setActions([...actions, ''])
  }

  return (
    <div className="flex flex-col items-center w-full pb-20">
      
      {/* 1. Nodo Inicial (Trigger) */}
      <div className="w-full relative z-10">
        <TriggerSelector value={trigger} onChange={setTrigger} />
      </div>

      {/* Solo mostramos la línea y las acciones si ya se eligió un Trigger */}
      {trigger && (
        <>
          {/* Línea conectora */}
          <div className="w-1 h-12 bg-blue-200 dark:bg-blue-900/50 relative z-0" />

          {/* 2. Nodos de Acción */}
          {actions.map((action, index) => (
            <div key={index} className="flex flex-col items-center w-full">
              <div className="w-full relative z-10">
                <ActionSelector 
                  value={action} 
                  onChange={(val) => {
                    const newActions = [...actions]
                    newActions[index] = val
                    setActions(newActions)
                  }} 
                />
              </div>
              <div className="w-1 h-12 bg-indigo-200 dark:bg-indigo-900/50 relative z-0" />
            </div>
          ))}

          {/* Botón para añadir la siguiente acción */}
          <button 
            onClick={handleAddAction}
            className="w-14 h-14 rounded-full bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:scale-110 transition-all z-10 shadow-sm"
            title="Añadir paso"
          >
            <Plus className="w-6 h-6" />
          </button>
        </>
      )}

    </div>
  )
}
