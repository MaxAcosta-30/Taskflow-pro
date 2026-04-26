// =============================================================
//  TaskFlow Pro — Tipos Globales
// =============================================================

// ── Respuestas API ─────────────────────────────────────────────
export type ApiResponse<T = unknown> = {
  success: true
  data: T
  message?: string
} | {
  success: false
  error: string
  code?: string
  details?: Record<string, string[]>
}

export type PaginatedResponse<T> = {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// ── Auth ───────────────────────────────────────────────────────
export type AuthTokens = {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export type JwtPayload = {
  sub: string        // userId
  email: string
  role: string
  teamId?: string
  iat: number
  exp: number
}

// ── WebSocket Events ───────────────────────────────────────────
export type SocketEvents = {
  // Task events
  'task:created':  { task: TaskWithRelations; boardId: string }
  'task:updated':  { task: TaskWithRelations; boardId: string }
  'task:deleted':  { taskId: string; boardId: string }
  'task:moved':    { taskId: string; fromColumnId: string; toColumnId: string; position: number }

  // Comment events
  'comment:created': { comment: CommentWithAuthor; taskId: string }
  'comment:deleted': { commentId: string; taskId: string }

  // Notification events
  'notification:new': { notification: NotificationItem }

  // Board events
  'board:updated': { boardId: string }

  // Automation events
  'automation:triggered': { automationId: string; taskId?: string }

  // Presence
  'user:joined': { userId: string; boardId: string }
  'user:left':   { userId: string; boardId: string }
}

// ── Task & Board types ────────────────────────────────────────
export type TaskWithRelations = {
  id: string
  title: string
  description: string | null
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED'
  position: number
  dueDate: string | null
  columnId: string
  createdAt: string
  updatedAt: string
  creator: { id: string; name: string; avatarUrl: string | null }
  assignee: { id: string; name: string; avatarUrl: string | null } | null
  labels: Array<{ id: string; name: string; color: string }>
  _count: { comments: number }
}

export type CommentWithAuthor = {
  id: string
  content: string
  isEdited: boolean
  createdAt: string
  author: { id: string; name: string; avatarUrl: string | null }
}

export type NotificationItem = {
  id: string
  type: string
  title: string
  body: string
  data: Record<string, unknown> | null
  isRead: boolean
  createdAt: string
}

// ── Queue Job Types ───────────────────────────────────────────
export type AutomationJobData = {
  automationId: string
  triggeredBy?: string
  taskId?: string
  triggerType?: string
  triggerPayload?: Record<string, unknown>
}

export type NotificationJobData = {
  userId: string
  type: string
  title: string
  body: string
  data?: Record<string, unknown>
}

// ── External APIs ─────────────────────────────────────────────
export type WeatherData = {
  temperature: number
  weatherCode: number
  windSpeed: number
  precipitation: number
  description: string
}

export type NewsArticle = {
  title: string
  description: string | null
  url: string
  source: string
  publishedAt: string
}
