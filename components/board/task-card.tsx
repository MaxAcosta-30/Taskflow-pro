// =============================================================
//  components/board/task-card.tsx
// =============================================================

'use client'

import { useSortable }   from '@dnd-kit/sortable'
import { CSS }           from '@dnd-kit/utilities'
import {
  MessageSquare, Calendar, AlertCircle,
  ArrowUp, ArrowRight, Minus,
} from 'lucide-react'
import { useState }      from 'react'

import type { Task }   from '@/hooks/use-board'

import { TaskModal }   from './task-modal'

type Props = {
  task:       Task
  boardId:    string
  isDragging?: boolean
}

const PRIORITY_CONFIG = {
  URGENT: { icon: AlertCircle, color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-950/30',    label: 'Urgente' },
  HIGH:   { icon: ArrowUp,     color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30', label: 'Alta' },
  MEDIUM: { icon: ArrowRight,  color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/30', label: 'Media' },
  LOW:    { icon: Minus,       color: 'text-slate-400',  bg: 'bg-slate-50 dark:bg-slate-800',   label: 'Baja' },
}

export function TaskCard({ task, boardId, isDragging = false }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging: isSortableDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform:  CSS.Transform.toString(transform),
    transition,
    opacity:    isSortableDragging ? 0.3 : 1,
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
          <div className="flex flex-wrap gap-1 mb-2">
            {task.labels.slice(0, 3).map(({ label }) => (
              <span
                key={label.id}
                className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                style={{ backgroundColor: label.color }}
              >
                {label.name}
              </span>
            ))}
            {task.labels.length > 3 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium
                               bg-slate-200 dark:bg-slate-700 text-slate-500">
                +{task.labels.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Título */}
        <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-snug mb-2">
          {task.title}
        </p>

        {/* Footer de la tarjeta */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Prioridad */}
            {PriorityIcon && (
              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${priority.bg}`}>
                <PriorityIcon className={`w-2.5 h-2.5 ${priority.color}`} />
                <span className={priority.color}>{priority.label}</span>
              </div>
            )}

            {/* Fecha límite */}
            {task.dueDate && (
              <div className={`flex items-center gap-1 text-[10px] font-medium
                ${isOverdue ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'}`}>
                <Calendar className="w-2.5 h-2.5" />
                {new Date(task.dueDate).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Comentarios */}
            {task._count.comments > 0 && (
              <div className="flex items-center gap-0.5 text-[10px] text-slate-400">
                <MessageSquare className="w-2.5 h-2.5" />
                {task._count.comments}
              </div>
            )}

            {/* Avatar del asignado */}
            {task.assignee && (
              <div
                title={task.assignee.name}
                className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 overflow-hidden flex-shrink-0"
              >
                {task.assignee.avatarUrl
                  ? <img src={task.assignee.avatarUrl} alt={task.assignee.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center">
                      <span className="text-[9px] font-bold text-blue-600 dark:text-blue-300">
                        {task.assignee.name.charAt(0)}
                      </span>
                    </div>
                }
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de detalle */}
      {modalOpen && (
        <TaskModal
          task={task}
          boardId={boardId}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}
