// =============================================================
//  components/board/task-modal.tsx — Modal de detalle de tarea
// =============================================================

'use client'

import {
  X, Trash2, MessageSquare,
  Calendar, User, Flag, Loader2, Send,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

import { useDeleteTask, useComments, useCreateComment } from '@/hooks/use-board'
import type { Task }    from '@/hooks/use-board'
import { useAuthStore } from '@/stores/auth.store'

type Props = { task: Task; boardId: string; onClose: () => void }

const PRIORITY_LABELS  = { URGENT: 'Urgente', HIGH: 'Alta', MEDIUM: 'Media', LOW: 'Baja' }
const PRIORITY_COLORS  = { URGENT: 'text-red-500', HIGH: 'text-orange-500', MEDIUM: 'text-yellow-500', LOW: 'text-slate-400' }

export function TaskModal({ task, boardId, onClose }: Props) {
  const { user }                      = useAuthStore()
  const { mutate: deleteTask, isPending: deleting } = useDeleteTask(boardId)
  const { data: comments, isLoading: loadingComments } = useComments(task.id)
  const { mutate: createComment, isPending: commenting } = useCreateComment(task.id)

  const [commentText, setCommentText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  const handleDelete = () => {
    deleteTask(task.id, { onSuccess: onClose })
  }

  const handleComment = () => {
    if (!commentText.trim()) return
    createComment(commentText, { onSuccess: () => setCommentText('') })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl
                      w-full max-w-2xl max-h-[85vh] flex flex-col animate-fade-in
                      border border-slate-200 dark:border-slate-700">

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white leading-tight">
              {task.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 rounded-lg text-slate-400 hover:text-red-500
                         hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              title="Eliminar tarea"
            >
              {deleting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Trash2 className="w-4 h-4" />
              }
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600
                         hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Metadatos */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {/* Prioridad */}
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500 dark:text-slate-400">Prioridad:</span>
                <span className={`font-medium ${PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]}`}>
                  {PRIORITY_LABELS[task.priority as keyof typeof PRIORITY_LABELS]}
                </span>
              </div>

              {/* Asignado */}
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500 dark:text-slate-400">Asignado:</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {task.assignee?.name ?? 'Sin asignar'}
                </span>
              </div>

              {/* Fecha límite */}
              {task.dueDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500 dark:text-slate-400">Vence:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {new Date(task.dueDate).toLocaleDateString('es-MX', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </span>
                </div>
              )}

              {/* Creador */}
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500 dark:text-slate-400">Creado por:</span>
                <span className="text-slate-700 dark:text-slate-300">{task.creator.name}</span>
              </div>
            </div>

            {/* Descripción */}
            {task.description && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider
                               text-slate-400 dark:text-slate-500 mb-2">
                  Descripción
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>
            )}

            {/* Labels */}
            {task.labels.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider
                               text-slate-400 dark:text-slate-500 mb-2">
                  Etiquetas
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {task.labels.map(({ label }) => (
                    <span
                      key={label.id}
                      className="px-2 py-1 rounded-md text-xs font-medium text-white"
                      style={{ backgroundColor: label.color }}
                    >
                      {label.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Comentarios */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider
                             text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Comentarios ({comments?.length ?? 0})
              </h4>

              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {loadingComments && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  </div>
                )}

                {comments?.map((comment) => (
                  <div key={comment.id} className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 flex-shrink-0 overflow-hidden">
                      {comment.author.avatarUrl
                        ? <img src={comment.author.avatarUrl} alt={comment.author.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                              {comment.author.name.charAt(0)}
                            </span>
                          </div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {comment.author.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(comment.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input de comentario */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                  placeholder="Escribe un comentario..."
                  className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700
                             bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white
                             placeholder:text-slate-400
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleComment}
                  disabled={commenting || !commentText.trim()}
                  className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-700
                             text-white disabled:text-slate-400 rounded-lg transition-colors"
                >
                  {commenting
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
