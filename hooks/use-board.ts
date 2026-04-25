/* eslint-disable @typescript-eslint/require-await, @typescript-eslint/no-unused-vars */
// =============================================================
//  hooks/use-board.ts — TanStack Query hooks para boards/tasks
// =============================================================

'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { CreateTaskInput, MoveTaskInput } from '@/lib/validations'

const API = '/api'

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res  = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options })
  const data = await res.json() as { success: boolean; data?: T; error?: string }
  if (!res.ok || !data.success) throw new Error(data.error ?? 'Error en la petición')
  return data.data as T
}

// ── Boards ────────────────────────────────────────────────────
export function useBoards() {
  return useQuery({
    queryKey: ['boards'],
    queryFn:  () => apiFetch<Board[]>(`${API}/boards`),
  })
}

export function useBoard(boardId: string) {
  return useQuery({
    queryKey: ['board', boardId],
    queryFn:  () => apiFetch<BoardDetail>(`${API}/boards/${boardId}`),
    enabled:  !!boardId,
  })
}

export function useCreateBoard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; description?: string; color?: string }) =>
      apiFetch<Board>(`${API}/boards`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['boards'] }),
  })
}

// ── Tasks ─────────────────────────────────────────────────────
export function useCreateTask(boardId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTaskInput) =>
      apiFetch<Task>(`${API}/tasks`, { method: 'POST', body: JSON.stringify(data) }),
    // Optimistic update: inserta la tarea en la UI antes de que el servidor responda
    onMutate: async (newTask) => {
      await qc.cancelQueries({ queryKey: ['board', boardId] })
      const prev = qc.getQueryData<BoardDetail>(['board', boardId])

      qc.setQueryData(['board', boardId], (old: BoardDetail | undefined) => {
        if (!old) return old
        return {
          ...old,
          columns: old.columns.map((col) =>
            col.id === newTask.columnId
              ? {
                  ...col,
                  tasks: [
                    ...col.tasks,
                    {
                      ...newTask,
                      id:       'temp-' + Date.now(),
                      position: 999,
                      _count:   { comments: 0 },
                      creator:  { id: '', name: 'Tú', avatarUrl: null },
                      assignee: null,
                      labels:   [],
                      dueDate:  newTask.dueDate ?? null,
                    },
                  ],
                }
              : col,
          ),
        }
      })
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['board', boardId], ctx.prev)
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ['board', boardId] }),
  })
}

export function useMoveTask(boardId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: MoveTaskInput) =>
      apiFetch(`${API}/tasks/${data.taskId}/move`, {
        method: 'PATCH',
        body:   JSON.stringify({ toColumnId: data.toColumnId, position: data.position }),
      }),
    onSettled: () => void qc.invalidateQueries({ queryKey: ['board', boardId] }),
  })
}

export function useDeleteTask(boardId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (taskId: string) =>
      apiFetch(`${API}/tasks/${taskId}`, { method: 'DELETE' }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['board', boardId] }),
  })
}

export function useUpdateTask(boardId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: Partial<CreateTaskInput> }) =>
      apiFetch(`${API}/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['board', boardId] }),
  })
}

// ── Comments ──────────────────────────────────────────────────
export function useComments(taskId: string) {
  return useQuery({
    queryKey: ['comments', taskId],
    queryFn:  () => apiFetch<Comment[]>(`${API}/tasks/${taskId}/comments`),
    enabled:  !!taskId,
  })
}

export function useCreateComment(taskId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (content: string) =>
      apiFetch(`${API}/tasks/${taskId}/comments`, {
        method: 'POST',
        body:   JSON.stringify({ content }),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['comments', taskId] }),
  })
}

// ── Types ─────────────────────────────────────────────────────
export type Board = { id: string; name: string; color: string; description: string | null; _count: { columns: number } }
export type Task  = {
  id: string; title: string; description: string | null
  priority: string; status: string; position: number
  columnId: string; dueDate: string | null
  creator: { id: string; name: string; avatarUrl: string | null }
  assignee: { id: string; name: string; avatarUrl: string | null } | null
  labels: Array<{ label: { id: string; name: string; color: string } }>
  _count: { comments: number }
}
export type Column     = { id: string; name: string; color: string; position: number; tasks: Task[] }
export type BoardDetail = {
  id: string; name: string; color: string; teamId: string
  team: { id: string; name: string; members: Array<{ teamRole: string; user: { id: string; name: string; avatarUrl: string | null } }> }
  columns: Column[]
}
export type Comment = {
  id: string; content: string; isEdited: boolean; createdAt: string
  author: { id: string; name: string; avatarUrl: string | null }
}
