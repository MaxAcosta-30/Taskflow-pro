// =============================================================
//  components/board/kanban-board.tsx — Drag & Drop principal
// =============================================================

'use client'

import {
  DndContext, DragOverlay, PointerSensor,
  useSensor, useSensors, closestCorners,
  type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useState, useCallback, useEffect } from 'react'

import { useMoveTask }   from '@/hooks/use-board'
import type { BoardDetail, Column, Task } from '@/hooks/use-board'

import { KanbanColumn }  from './kanban-column'
import { TaskCard }      from './task-card'

type Props = { board: BoardDetail }

export function KanbanBoard({ board }: Props) {
  // Copia local de columnas para optimistic updates durante el drag
  const [localColumns, setLocalColumns] = useState<Column[]>(board.columns)
  const [activeTask, setActiveTask]     = useState<Task | null>(null)
  const { mutate: moveTask }            = useMoveTask(board.id)

  // Sincronizar cuando el server actualiza el board (ej: via WebSocket)
  useEffect(() => {
    setLocalColumns(board.columns)
  }, [board.columns])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }, // evitar clicks accidentales
    }),
  )

  const findColumn = useCallback(
    (id: string) => localColumns.find((c) => c.tasks.some((t) => t.id === id) || c.id === id),
    [localColumns],
  )

  const handleDragStart = ({ active }: DragStartEvent) => {
    const task = localColumns.flatMap((c) => c.tasks).find((t) => t.id === active.id)
    setActiveTask(task ?? null)
  }

  // Durante el drag: mover la tarjeta optimisticamente en la UI
  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || active.id === over.id) return

    const fromCol = findColumn(active.id as string)
    const toCol   = localColumns.find((c) => c.id === over.id)
      ?? findColumn(over.id as string)

    if (!fromCol || !toCol || fromCol.id === toCol.id) return

    setLocalColumns((cols) =>
      cols.map((col) => {
        const task = fromCol.tasks.find((t) => t.id === active.id)!
        if (col.id === fromCol.id) {
          return { ...col, tasks: col.tasks.filter((t) => t.id !== active.id) }
        }
        if (col.id === toCol.id) {
          return { ...col, tasks: [...col.tasks, { ...task, columnId: toCol.id }] }
        }
        return col
      }),
    )
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveTask(null)
    if (!over || active.id === over.id) return

    const fromCol = findColumn(active.id as string)
    if (!fromCol) return

    // ¿Cayó sobre una columna o una tarea?
    const toColId = localColumns.find((c) => c.id === over.id)?.id
      ?? findColumn(over.id as string)?.id

    if (!toColId) return

    const toCol    = localColumns.find((c) => c.id === toColId)!
    const overTask = toCol.tasks.find((t) => t.id === over.id)
    const position = overTask ? overTask.position : toCol.tasks.length

    // Reordenar dentro de la misma columna
    if (fromCol.id === toColId) {
      const taskIds = fromCol.tasks.map((t) => t.id)
      const oldIdx  = taskIds.indexOf(active.id as string)
      const newIdx  = overTask ? taskIds.indexOf(over.id as string) : taskIds.length - 1
      if (oldIdx !== newIdx) {
        setLocalColumns((cols) =>
          cols.map((col) =>
            col.id === fromCol.id
              ? { ...col, tasks: arrayMove(col.tasks, oldIdx, newIdx).map((t, i) => ({ ...t, position: i })) }
              : col,
          ),
        )
      }
    }

    moveTask({
      taskId:     active.id as string,
      toColumnId: toColId,
      position,
    })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban-board h-full">
        {localColumns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            boardId={board.id}
            members={board.team.members.map((m) => m.user)}
          />
        ))}
      </div>

      {/* Overlay para la tarjeta siendo arrastrada */}
      <DragOverlay>
        {activeTask && (
          <div className="rotate-2 opacity-95 shadow-2xl scale-105">
            <TaskCard task={activeTask} boardId={board.id} isDragging />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

