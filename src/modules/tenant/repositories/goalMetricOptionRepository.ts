import type { ApiResponse } from '@/core/types/api'
import type { GoalMetricOption } from '../schemas/projectCreationReference'
import { parseResponseJson } from '@/core/api/safeParseResponse'

const API_BASE = typeof window !== 'undefined' ? '' : 'http://localhost:3001'

async function request<T>(
  url: string,
  opts?: { method?: string; body?: unknown }
): Promise<ApiResponse<T>> {
  const { method = 'GET', body } = opts ?? {}
  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const json = await parseResponseJson<{ code: number; message: string; data: T; meta?: unknown }>(res)
  if (!res.ok) {
    return {
      code: res.status,
      message: (json as { message?: string }).message ?? `HTTP ${res.status}`,
      data: null as T,
      meta: json.meta as ApiResponse<T>['meta'],
    }
  }
  return {
    code: json.code,
    message: json.message,
    data: json.data,
    meta: json.meta as ApiResponse<T>['meta'],
  }
}

export async function fetchGoalMetricOptions(): Promise<ApiResponse<GoalMetricOption[]>> {
  return request<GoalMetricOption[]>('/api/config/goal-metric-options')
}

/** 按 code 列表筛选指标选项（用于 GoalType.allowedMetricOptions 约束） */
export async function fetchGoalMetricOptionsByCodes(
  codes: string[]
): Promise<ApiResponse<GoalMetricOption[]>> {
  const res = await request<GoalMetricOption[]>('/api/config/goal-metric-options')
  if (res.code !== 0 || !res.data) return res
  const set = new Set(codes)
  const list = res.data.filter((m) => set.has(m.code) && m.status === 'active')
  return { ...res, data: list }
}

export async function fetchGoalMetricOptionByCode(
  code: string
): Promise<ApiResponse<GoalMetricOption | null>> {
  const res = await request<GoalMetricOption[]>('/api/config/goal-metric-options')
  if (res.code !== 0 || !res.data) return { ...res, data: null }
  const found = res.data.find((m) => m.code === code && m.status === 'active') ?? null
  return { ...res, data: found }
}
