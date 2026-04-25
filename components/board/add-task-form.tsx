// =============================================================
//  components/board/add-task-form.tsx
// =============================================================

'use client'

import { Loader2, X } from 'lucide-react'
import type { KeyboardEvent } from 'react';
import { useRef, useEffect } from 'react'
import { useForm }    from 'react-hook-form'

import { useCreateTask } from '@/hooks/use-board'

type Props = {
  columnId: string
  boardId:  string
  onClose:  () => void
}

export function AddTaskForm({ columnId, boardId, onClose }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ title: string }>()
  const { mutate: createTask, isPending } = useCreateTask(boardId)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => { textareaRef.current?.focus() }, [])

  const onSubmit = ({ title }: { title: string }) => {
    if (!title.trim()) return
    createTask(
      { columnId, title: title.trim(), priority: 'MEDIUM' },
      { onSuccess: () => { reset(); onClose() } },
    )
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSubmit(onSubmit)()
    }
    if (e.key === 'Escape') onClose()
  }

  const { ref: rhfRef, ...rest } = register('title', { required: true })

  return (
    <div className="bg-white dark:bg-slate-800 rounded-md border border-blue-400
                    shadow-md p-2 space-y-2">
      <textarea
        {...rest}
        ref={(el) => {
          rhfRef(el)
          // @ts-ignore
          textareaRef.current = el
        }}
        placeholder="Nombre de la tarea... (Enter para guardar)"
        rows={2}
        onKeyDown={handleKeyDown}
        className="w-full resize-none text-sm text-slate-800 dark:text-slate-200
                   bg-transparent placeholder:text-slate-400
                   focus:outline-none"
      />

      <div className="flex items-center gap-2">
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={isPending}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700
                     disabled:bg-blue-400 text-white text-xs font-medium rounded-md transition-colors"
        >
          {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          Agregar
        </button>

        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
