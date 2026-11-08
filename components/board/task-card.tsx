// =============================================================
//  components/board/task-card.tsx
// =============================================================

'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MessageSquare, Calendar, AlertCircle, ArrowUp, ArrowRight, Minus } from 'lucide-react'
import { useState } from 'react'

import { Avatar } from '@/components/shared/avatar'
import type { Task } from '@/hooks/use-board'

import { TaskModal } from './task-modal'

type Props = {
  task: Task
  boardId: string
  isDragging?: boolean
}

const PRIORITY_CONFIG = {
  URGENT: {
    icon: AlertCircle,
    color: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/40',
    label: 'Urgente',
  },
  HIGH: {
    icon: ArrowUp,
    color: 'text-orange-700 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    label: 'Alta',
  },
  // Media y Baja no piden atención: van en neutro, con su ícono y su texto.
  MEDIUM: {
    icon: ArrowRight,
    color: 'text-slate-600 dark:text-slate-300',
    bg: 'bg-slate-100 dark:bg-slate-700/60',
    label: 'Media',
  },
  LOW: { icon: Minus, color: 'text-slate-500 dark:text-slate-400', bg: 'bg-transparent', label: 'Baja' },
}

export function TaskCard({ task, boardId, isDragging = false }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.3 : 1,
  }

  const priority = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG]
  const PriorityIcon = priority?.icon

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => setModalOpen(true)}
        className={`task-card group ${isDragging ? 'dragging' : ''}`}
      >
        {/* Labels */}
        {task.labels.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {task.labels.slice(0, 3).map(({ label }) => (
              <span
                key={label.id}
                className="rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
                style={{ backgroundColor: label.color }}
              >
                {label.name}
              </span>
            ))}
            {task.labels.length > 3 && (
              <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-700">
                +{task.labels.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Título */}
        <p className="mb-2 text-sm font-medium leading-snug text-slate-800 dark:text-slate-200">
          {task.title}
        </p>

        {/* Footer de la tarjeta */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Prioridad */}
            {PriorityIcon && (
              <div
                className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${priority.bg}`}
              >
                <PriorityIcon className={`h-2.5 w-2.5 ${priority.color}`} />
                <span className={priority.color}>{priority.label}</span>
              </div>
            )}

            {/* Fecha límite */}
            {task.dueDate && (
              <div
                className={`flex items-center gap-1 font-mono text-[10px] ${isOverdue ? 'font-semibold text-red-700 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}
              >
                <Calendar className="h-2.5 w-2.5" />
                {new Date(task.dueDate).toLocaleDateString('es-MX', {
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Comentarios */}
            {task._count.comments > 0 && (
              <div className="flex items-center gap-0.5 text-[10px] text-slate-400">
                <MessageSquare className="h-2.5 w-2.5" />
                {task._count.comments}
              </div>
            )}

            {/* Avatar del asignado */}
            {task.assignee && <Avatar name={task.assignee.name} src={task.assignee.avatarUrl} size={20} />}
          </div>
        </div>
      </div>

      {/* Modal de detalle */}
      {modalOpen && <TaskModal task={task} boardId={boardId} onClose={() => setModalOpen(false)} />}
    </>
  )
}
