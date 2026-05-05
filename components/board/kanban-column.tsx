// =============================================================
//  components/board/kanban-column.tsx
// =============================================================

'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'

import type { Column, BoardDetail } from '@/hooks/use-board'

import { AddTaskForm } from './add-task-form'
import { TaskCard } from './task-card'

type Member = BoardDetail['team']['members'][number]['user']

type Props = {
  column: Column
  boardId: string
  members: Member[]
}

export function KanbanColumn({ column, boardId, members }: Props) {
  const [addingTask, setAddingTask] = useState(false)

  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  const taskCount = column.tasks.length

  return (
    <div className={`kanban-column ${isOver ? 'is-over' : ''}`}>
      {/* Header de columna */}
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: column.color }} />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {column.name}
          </h3>
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-200/80 px-1.5 text-xs font-semibold text-slate-400 dark:bg-slate-700">
            {taskCount}
          </span>
        </div>

        <button className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-200/80 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Tareas */}
      <div ref={setNodeRef} className="flex min-h-[60px] flex-1 flex-col gap-2">
        <SortableContext
          items={column.tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task) => (
            <TaskCard key={task.id} task={task} boardId={boardId} />
          ))}
        </SortableContext>

        {/* Formulario inline para agregar tarea */}
        {addingTask && (
          <AddTaskForm
            columnId={column.id}
            boardId={boardId}
            onClose={() => setAddingTask(false)}
          />
        )}
      </div>

      {/* Agregar tarea */}
      {!addingTask && (
        <button
          onClick={() => setAddingTask(true)}
          className="mt-2 flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-slate-400 transition-colors hover:bg-slate-200/80 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar tarea
        </button>
      )}
    </div>
  )
}
