/* eslint-disable @typescript-eslint/no-unused-vars */
// =============================================================
//  hooks/use-socket.ts — Socket.io client hook
// =============================================================

'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useCallback } from 'react'
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client'

import { useAuthStore } from '@/stores/auth.store'
import type { SocketEvents } from '@/types'

let socket: Socket | null = null

function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? '', {
      path:        '/socket.io',
      transports:  ['websocket'],
      autoConnect: false,
    })
  }
  return socket
}

// ── Hook: conexión global (montar en layout de dashboard) ─────
export function useSocketConnection() {
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) return

    const s = getSocket()
    if (!s.connected) s.connect()

    s.on('connect',       () => console.log('[Socket] Connected:', s.id))
    s.on('disconnect',    () => console.log('[Socket] Disconnected'))
    s.on('connect_error', (err) => console.warn('[Socket] Error:', err.message))

    return () => {
      s.off('connect')
      s.off('disconnect')
      s.off('connect_error')
    }
  }, [isAuthenticated])
}

// ── Hook: sincronización de un tablero en tiempo real ─────────
export function useBoardSocket(boardId: string) {
  const queryClient = useQueryClient()
  const joinedRef   = useRef(false)

  // Unirse al room del tablero
  useEffect(() => {
    const s = getSocket()

    const join = () => {
      if (!joinedRef.current) {
        s.emit('board:join', boardId)
        joinedRef.current = true
      }
    }

    if (s.connected) join()
    else s.once('connect', join)

    return () => {
      s.emit('board:leave', boardId)
      joinedRef.current = false
    }
  }, [boardId])

  // Escuchar eventos y actualizar cache de TanStack Query
  useEffect(() => {
    const s = getSocket()
    const key = ['board', boardId]

    const onTaskCreated = ({ task, boardId: bid }: SocketEvents['task:created']) => {
      queryClient.setQueryData(key, (old: BoardData | undefined) => {
        if (!old) return old
        return addTaskToBoard(old, task)
      })
    }

    const onTaskUpdated = ({ task }: SocketEvents['task:updated']) => {
      queryClient.setQueryData(key, (old: BoardData | undefined) => {
        if (!old) return old
        return updateTaskInBoard(old, task)
      })
    }

    const onTaskDeleted = ({ taskId }: SocketEvents['task:deleted']) => {
      queryClient.setQueryData(key, (old: BoardData | undefined) => {
        if (!old) return old
        return removeTaskFromBoard(old, taskId)
      })
    }

    const onTaskMoved = ({ taskId, fromColumnId, toColumnId, position }: SocketEvents['task:moved']) => {
      queryClient.setQueryData(key, (old: BoardData | undefined) => {
        if (!old) return old
        return moveTaskInBoard(old, taskId, fromColumnId, toColumnId, position)
      })
    }

    s.on('task:created', onTaskCreated)
    s.on('task:updated', onTaskUpdated)
    s.on('task:deleted', onTaskDeleted)
    s.on('task:moved',   onTaskMoved)

    return () => {
      s.off('task:created', onTaskCreated)
      s.off('task:updated', onTaskUpdated)
      s.off('task:deleted', onTaskDeleted)
      s.off('task:moved',   onTaskMoved)
    }
  }, [boardId, queryClient])
}

// ── Hook: notificaciones en tiempo real ───────────────────────
export function useNotificationSocket(onNotification: (n: SocketEvents['notification:new']['notification']) => void) {
  const cbRef = useRef(onNotification)
  cbRef.current = onNotification

  useEffect(() => {
    const s = getSocket()
    const handler = ({ notification }: SocketEvents['notification:new']) => {
      cbRef.current(notification)
    }
    s.on('notification:new', handler)
    return () => { s.off('notification:new', handler) }
  }, [])
}

// ── Helpers de mutación de cache ──────────────────────────────
type Task = { id: string; columnId: string; position: number; [key: string]: unknown }
type Column = { id: string; tasks: Task[] }
type BoardData = { columns: Column[]; [key: string]: unknown }

function addTaskToBoard(board: BoardData, task: Task): BoardData {
  return {
    ...board,
    columns: board.columns.map((col) =>
      col.id === task.columnId
        ? { ...col, tasks: [...col.tasks, task].sort((a, b) => a.position - b.position) }
        : col,
    ),
  }
}

function updateTaskInBoard(board: BoardData, updated: Task): BoardData {
  return {
    ...board,
    columns: board.columns.map((col) => ({
      ...col,
      tasks: col.tasks.map((t) => (t.id === updated.id ? updated : t)),
    })),
  }
}

function removeTaskFromBoard(board: BoardData, taskId: string): BoardData {
  return {
    ...board,
    columns: board.columns.map((col) => ({
      ...col,
      tasks: col.tasks.filter((t) => t.id !== taskId),
    })),
  }
}

function moveTaskInBoard(
  board: BoardData,
  taskId: string,
  fromColumnId: string,
  toColumnId: string,
  position: number,
): BoardData {
  let movedTask: Task | undefined

  // Extraer tarea de columna origen
  const cols = board.columns.map((col) => {
    if (col.id !== fromColumnId) return col
    const task = col.tasks.find((t) => t.id === taskId)
    if (task) movedTask = { ...task, columnId: toColumnId, position }
    return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) }
  })

  if (!movedTask) return board

  // Insertar en columna destino
  return {
    ...board,
    columns: cols.map((col) => {
      if (col.id !== toColumnId) return col
      const tasks = [...col.tasks, movedTask!].sort((a, b) => a.position - b.position)
      return { ...col, tasks }
    }),
  }
}
