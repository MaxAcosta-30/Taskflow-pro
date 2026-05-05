// =============================================================
//  components/board/add-task-form.tsx
// =============================================================

'use client'

import { Loader2, X } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { useCreateTask } from '@/hooks/use-board'

type Props = {
  columnId: string
  boardId: string
  onClose: () => void
}

export function AddTaskForm({ columnId, boardId, onClose }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: {},
  } = useForm<{ title: string }>()
  const { mutate: createTask, isPending } = useCreateTask(boardId)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const onSubmit = ({ title }: { title: string }) => {
    if (!title.trim()) return
    createTask(
      { columnId, title: title.trim(), priority: 'MEDIUM' },
      {
        onSuccess: () => {
          reset()
          onClose()
        },
      },
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
    <div className="space-y-2 rounded-md border border-blue-400 bg-white p-2 shadow-md dark:bg-slate-800">
      <textarea
        {...rest}
        ref={(el) => {
          rhfRef(el)
          textareaRef.current = el
        }}
        placeholder="Nombre de la tarea... (Enter para guardar)"
        rows={2}
        onKeyDown={handleKeyDown}
        className="w-full resize-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-200"
      />

      <div className="flex items-center gap-2">
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={isPending}
          className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          Agregar
        </button>

        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
