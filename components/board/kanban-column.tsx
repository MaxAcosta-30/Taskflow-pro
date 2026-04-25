// =============================================================
//  components/board/kanban-column.tsx
// =============================================================

'use client'

import { useDroppable }       from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, MoreHorizontal } from 'lucide-react'
import { useState }           from 'react'

import type { Column, BoardDetail } from '@/hooks/use-board'

import { AddTaskForm }   from './add-task-form'
import { TaskCard }      from './task-card'

type Member = BoardDetail['team']['members'][number]['user']

type Props = {
  column:  Column
  boardId: string
  members: Member[]
}

export function KanbanColumn({ column, boardId, members }: Props) {
  const [addingTask, setAddingTask] = useState(false)

  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  const taskCount = column.tasks.length

  return (
    <div className={`kanban-column transition-colors duration-150
      ${isOver ? 'bg-blue-50 dark:bg-blue-950/20 ring-2 ring-blue-400/50 ring-inset' : ''}`}
    >
      {/* Header de columna */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {column.name}
          </h3>
          <span className="text-xs font-medium text-slate-400 bg-slate-200 dark:bg-slate-700
                           w-5 h-5 rounded-full flex items-center justify-center">
            {taskCount}
          </span>
        </div>

        <button className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Tareas */}
      <div
        ref={setNodeRef}
        className="flex flex-col gap-2 flex-1 min-h-[80px]"
      >
        <SortableContext
          items={column.tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              boardId={boardId}
            />
          ))}
        </SortableContext>

        {/* Formulario inline para agregar tarea */}
        {addingTask && (
          <AddTaskForm
            columnId={column.id}
            onClose={() => setAddingTask(false)}
          />
        )}
      </div>

      {/* Agregar tarea */}
      {!addingTask && (
        <button
          onClick={() => setAddingTask(true)}
          className="mt-2 w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm
                     text-slate-400 dark:text-slate-500
                     hover:bg-slate-200 dark:hover:bg-slate-700
                     hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar tarea
        </button>
      )}
    </div>
  )
}
