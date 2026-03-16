import type { ApiResponse } from '@/core/types/api'
import type { PlannerStrategyProfile } from '../schemas/plannerStrategyProfile'
import { parseResponseJson } from '@/core/api/safeParseResponse'

const API_BASE = typeof window !== 'undefined' ? '' : 'http://localhost:3001'

async function request<T>(url: string): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
  })
  const json = await parseResponseJson<{ code: number; message: string; data: T; meta?: unknown }>(res)
  if (!res.ok) return { code: res.status, message: (json as { message?: string }).message ?? `HTTP ${res.status}`, data: null as T, meta: json.meta as ApiResponse<T>['meta'] }
  return { code: json.code, message: json.message, data: json.data, meta: json.meta as ApiResponse<T>['meta'] }
}

export async function fetchStrategyProfileById(
  id: string
): Promise<ApiResponse<PlannerStrategyProfile | null>> {
  return request<PlannerStrategyProfile | null>(`/api/planner-strategy-profiles/${id}`)
}
