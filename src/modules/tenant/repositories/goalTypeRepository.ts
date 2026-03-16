import type { ApiResponse } from '@/core/types/api'
import type { GoalType } from '../schemas/projectCreationReference'
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

export async function fetchGoalTypes(): Promise<ApiResponse<GoalType[]>> {
  return request<GoalType[]>('/api/config/goal-types')
}

/** 按项目类型 code 筛选允许的 GoalType */
export async function fetchGoalTypesByProjectTypeCode(
  projectTypeCode: string
): Promise<ApiResponse<GoalType[]>> {
  const res = await request<GoalType[]>('/api/config/goal-types')
  if (res.code !== 0 || !res.data) return res
  const list = res.data.filter((g) => g.relatedProjectType === projectTypeCode)
  return { ...res, data: list }
}

export async function fetchGoalTypeByCode(code: string): Promise<ApiResponse<GoalType | null>> {
  const res = await request<GoalType[]>('/api/config/goal-types')
  if (res.code !== 0 || !res.data) return { ...res, data: null }
  const found = res.data.find((g) => g.code === code) ?? null
  return { ...res, data: found }
}
