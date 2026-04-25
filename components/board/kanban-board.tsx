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
import { useState, useCallback } from 'react'

import { useMoveTask }   from '@/hooks/use-board'
import type { BoardDetail, Task } from '@/hooks/use-board'

import { KanbanColumn }  from './kanban-column'
import { TaskCard }      from './task-card'

type Props = { board: BoardDetail }

export function KanbanBoard({ board }: Props) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const { mutate: moveTask }        = useMoveTask(board.id)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }, // evitar clicks accidentales
    }),
  )

  const findColumn = useCallback(
    (id: string) => board.columns.find((c) => c.tasks.some((t) => t.id === id) || c.id === id),
    [board.columns],
  )

  const handleDragStart = ({ active }: DragStartEvent) => {
    const task = board.columns.flatMap((c) => c.tasks).find((t) => t.id === active.id)
    setActiveTask(task ?? null)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveTask(null)
    if (!over || active.id === over.id) return

    const fromCol = findColumn(active.id as string)
    if (!fromCol) return

    // ¿Cayó sobre una columna o una tarea?
    const toColId = board.columns.find((c) => c.id === over.id)?.id
      ?? findColumn(over.id as string)?.id

    if (!toColId) return

    const toCol    = board.columns.find((c) => c.id === toColId)!
    const overTask = toCol.tasks.find((t) => t.id === over.id)
    const position = overTask ? overTask.position : toCol.tasks.length

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
      onDragEnd={handleDragEnd}
    >
      <div className="kanban-board h-full">
        {board.columns.map((column) => (
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
          <div className="rotate-3 opacity-95 shadow-2xl">
            <TaskCard task={activeTask} boardId={board.id} isDragging />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
