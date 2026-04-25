// =============================================================
//  lib/validations/index.ts — Zod Schemas
//  Validación de todos los datos de entrada de la API
// =============================================================

import { z } from 'zod'

// ── Auth ───────────────────────────────────────────────────────
export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede superar 50 caracteres')
    .trim(),
  email: z
    .string()
    .email('Email inválido')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
})

export const loginSchema = z.object({
  email:    z.string().email().toLowerCase().trim(),
  password: z.string().min(1, 'Contraseña requerida'),
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
})

// ── Boards ────────────────────────────────────────────────────
export const createBoardSchema = z.object({
  name:        z.string().min(1).max(100).trim(),
  description: z.string().max(500).optional(),
  color:       z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6'),
})

export const updateBoardSchema = createBoardSchema.partial().extend({
  isArchived: z.boolean().optional(),
})

// ── Columns ───────────────────────────────────────────────────
export const createColumnSchema = z.object({
  boardId:  z.string().cuid(),
  name:     z.string().min(1).max(50).trim(),
  color:    z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  position: z.number().int().min(0).optional(),
})

export const reorderColumnsSchema = z.object({
  columns: z.array(
    z.object({ id: z.string().cuid(), position: z.number().int().min(0) }),
  ),
})

// ── Tasks ─────────────────────────────────────────────────────
export const createTaskSchema = z.object({
  columnId:       z.string().cuid(),
  title:          z.string().min(1, 'El título es requerido').max(200).trim(),
  description:    z.string().max(5000).optional(),
  priority:       z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  assigneeId:     z.string().cuid().optional(),
  dueDate:        z.string().datetime().optional(),
  estimatedHours: z.number().positive().optional(),
  labelIds:       z.array(z.string().cuid()).optional(),
})

export const updateTaskSchema = createTaskSchema.partial().omit({ columnId: true }).extend({
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED']).optional()
})

export const moveTaskSchema = z.object({
  taskId:       z.string().cuid(),
  toColumnId:   z.string().cuid(),
  position:     z.number().int().min(0),
})

export const reorderTasksSchema = z.object({
  tasks: z.array(
    z.object({ id: z.string().cuid(), position: z.number().int().min(0) }),
  ),
})

// ── Comments ──────────────────────────────────────────────────
export const createCommentSchema = z.object({
  content: z.string().min(1).max(2000).trim(),
})

// ── Labels ────────────────────────────────────────────────────
export const createLabelSchema = z.object({
  name:  z.string().min(1).max(30).trim(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
})

// ── Teams ─────────────────────────────────────────────────────
export const createTeamSchema = z.object({
  name:        z.string().min(2).max(50).trim(),
  description: z.string().max(300).optional(),
})

export const inviteMemberSchema = z.object({
  email:    z.string().email().toLowerCase(),
  teamRole: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER'),
})

// ── Automations ───────────────────────────────────────────────
export const triggerConfigSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('TASK_STALE'),
    daysStale: z.number().int().min(1).max(365),
  }),
  z.object({
    type: z.literal('TASK_MOVED'),
    fromColumnId: z.string().cuid().optional(),
    toColumnId: z.string().cuid().optional(),
  }),
  z.object({
    type: z.literal('TASK_DUE_SOON'),
    daysBeforeDue: z.number().int().min(1).max(30),
  }),
  z.object({
    type: z.literal('SCHEDULE'),
    cronExpression: z.string().min(5),
  }),
  z.object({
    type: z.literal('WEATHER'),
    weatherCondition: z.enum(['rain', 'snow', 'clear', 'cloudy', 'storm']),
    latitude:  z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  z.object({
    type: z.literal('WEBHOOK'),
    secret: z.string().optional(),
  }),
])

export const actionConfigSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('MOVE_TASK'), toColumnId: z.string().cuid() }),
  z.object({ type: z.literal('ASSIGN_USER'), userId: z.string().cuid() }),
  z.object({ type: z.literal('ADD_LABEL'), labelId: z.string().cuid() }),
  z.object({
    type: z.literal('SEND_NOTIFICATION'),
    title: z.string().min(1).max(100),
    body:  z.string().min(1).max(500),
  }),
  z.object({
    type: z.literal('WEBHOOK'),
    url:    z.string().url(),
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH']).default('POST'),
    headers: z.record(z.string()).optional(),
    body:    z.string().optional(),
  }),
])

export const createAutomationSchema = z.object({
  name:          z.string().min(1).max(100).trim(),
  description:   z.string().max(300).optional(),
  triggerType:   z.enum(['TASK_STALE', 'TASK_MOVED', 'TASK_ASSIGNED', 'TASK_DUE_SOON', 'SCHEDULE', 'WEATHER', 'WEBHOOK']),
  triggerConfig: z.record(z.unknown()),
  actions: z.array(
    z.object({
      actionType: z.enum(['MOVE_TASK', 'ASSIGN_USER', 'ADD_LABEL', 'SEND_NOTIFICATION', 'WEBHOOK', 'CREATE_TASK']),
      config:     z.record(z.unknown()),
      position:   z.number().int().min(0).default(0),
    }),
  ).min(1, 'Debe tener al menos una acción'),
})

// ── Pagination ────────────────────────────────────────────────
export const paginationSchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

// ── Types inferidos ───────────────────────────────────────────
export type RegisterInput         = z.infer<typeof registerSchema>
export type LoginInput            = z.infer<typeof loginSchema>
export type CreateBoardInput      = z.infer<typeof createBoardSchema>
export type CreateTaskInput       = z.infer<typeof createTaskSchema>
export type MoveTaskInput         = z.infer<typeof moveTaskSchema>
export type CreateAutomationInput = z.infer<typeof createAutomationSchema>
