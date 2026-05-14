// =============================================================
//  components/board/task-modal.tsx — Modal de detalle de tarea
// =============================================================

'use client'

import { X, Trash2, MessageSquare, Calendar, User, Flag, Loader2, Send } from 'lucide-react'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'

import { useDeleteTask, useComments, useCreateComment } from '@/hooks/use-board'
import type { Task } from '@/hooks/use-board'

type Props = { task: Task; boardId: string; onClose: () => void }

const PRIORITY_LABELS = { URGENT: 'Urgente', HIGH: 'Alta', MEDIUM: 'Media', LOW: 'Baja' }
const PRIORITY_COLORS = {
  URGENT: 'text-red-500',
  HIGH: 'text-orange-500',
  MEDIUM: 'text-yellow-500',
  LOW: 'text-slate-400',
}

export function TaskModal({ task, boardId, onClose }: Props) {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="animate-fade-in flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 p-6 pb-4 dark:border-slate-800">
          <div className="min-w-0 flex-1 pr-4">
            <h2 className="text-lg font-semibold leading-tight text-slate-900 dark:text-white">
              {task.title}
            </h2>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
              title="Eliminar tarea"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-6">
            {/* Metadatos */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {/* Prioridad */}
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500 dark:text-slate-400">Prioridad:</span>
                <span
                  className={`font-medium ${PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]}`}
                >
                  {PRIORITY_LABELS[task.priority as keyof typeof PRIORITY_LABELS]}
                </span>
              </div>

              {/* Asignado */}
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500 dark:text-slate-400">Asignado:</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {task.assignee?.name ?? 'Sin asignar'}
                </span>
              </div>

              {/* Fecha límite */}
              {task.dueDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-500 dark:text-slate-400">Vence:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {new Date(task.dueDate).toLocaleDateString('es-MX', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}

              {/* Creador */}
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500 dark:text-slate-400">Creado por:</span>
                <span className="text-slate-700 dark:text-slate-300">{task.creator.name}</span>
              </div>
            </div>

            {/* Descripción */}
            {task.description && (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Descripción
                </h4>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {task.description}
                </p>
              </div>
            )}

            {/* Labels */}
            {task.labels.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Etiquetas
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {task.labels.map(({ label }) => (
                    <span
                      key={label.id}
                      className="rounded-md px-2 py-1 text-xs font-medium text-white"
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
              <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <MessageSquare className="h-3.5 w-3.5" />
                Comentarios ({comments?.length ?? 0})
              </h4>

              <div className="max-h-48 space-y-3 overflow-y-auto pr-1">
                {loadingComments && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  </div>
                )}

                {comments?.map((comment) => (
                  <div key={comment.id} className="flex gap-2.5">
                    <div className="relative h-7 w-7 flex-shrink-0 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900">
                      {comment.author.avatarUrl ? (
                        <Image
                          src={comment.author.avatarUrl}
                          alt={comment.author.name}
                          fill
                          className="object-cover"
                          sizes="28px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                            {comment.author.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {comment.author.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(comment.createdAt).toLocaleTimeString('es-MX', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm leading-snug text-slate-600 dark:text-slate-400">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input de comentario */}
              <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                  placeholder="Escribe un comentario..."
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  onClick={handleComment}
                  disabled={commenting || !commentText.trim()}
                  className="rounded-lg bg-blue-600 p-2 text-white transition-colors hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-700"
                >
                  {commenting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
