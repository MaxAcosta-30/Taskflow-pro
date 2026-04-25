// =============================================================
//  hooks/use-automations.ts — React Query hooks para automatizaciones
// =============================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import axios from 'axios'

// ── Types ────────────────────────────────────────────────────
export type ActionConfig =
  | { type: 'MOVE_TASK'; toColumnId: string }
  | { type: 'ASSIGN_USER'; userId: string }
  | { type: 'ADD_LABEL'; labelId: string }
  | { type: 'SEND_NOTIFICATION'; title: string; body: string; userId: string }
  | { type: 'WEBHOOK'; url: string; method: string; headers?: Record<string, string>; body?: string }
  | { type: 'CREATE_TASK'; title: string; columnId: string; description?: string }

export type AutomationAction = {
  actionType: string
  config: Record<string, unknown>
  position: number
}

export type CreateAutomationPayload = {
  name: string
  description?: string
  triggerType: string
  triggerConfig: Record<string, unknown>
  actions: AutomationAction[]
}

export type AutomationRecord = {
  id: string
  name: string
  description: string | null
  isActive: boolean
  triggerType: string
  lastRunAt: string | null
  createdAt: string
  _count: { runs: number; actions: number }
  creator: { id: string; name: string; avatarUrl: string | null }
}

// ── Fetch helpers ────────────────────────────────────────────
const api = axios.create({ baseURL: '/api' })

async function fetchAutomations(): Promise<AutomationRecord[]> {
  const { data } = await api.get<{ success: true; data: AutomationRecord[] }>('/automations')
  return data.data
}

async function createAutomation(payload: CreateAutomationPayload): Promise<AutomationRecord> {
  const { data } = await api.post<{ success: true; data: AutomationRecord }>('/automations', payload)
  return data.data
}

async function toggleAutomation({ id, isActive }: { id: string; isActive: boolean }): Promise<void> {
  await api.patch(`/automations/${id}`, { isActive })
}

async function deleteAutomation(id: string): Promise<void> {
  await api.delete(`/automations/${id}`)
}

// ── Hooks ────────────────────────────────────────────────────
export function useAutomations() {
  return useQuery({
    queryKey: ['automations'],
    queryFn: fetchAutomations,
    staleTime: 30_000,
  })
}

export function useCreateAutomation() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: createAutomation,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['automations'] })
      router.push('/automations')
    },
  })
}

export function useToggleAutomation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: toggleAutomation,
    onMutate: async ({ id, isActive }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['automations'] })
      const prev = queryClient.getQueryData<AutomationRecord[]>(['automations'])
      queryClient.setQueryData<AutomationRecord[]>(['automations'], (old) =>
        old?.map((a) => a.id === id ? { ...a, isActive } : a) ?? []
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['automations'], ctx.prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['automations'] }),
  })
}

export function useDeleteAutomation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAutomation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automations'] }),
  })
}
