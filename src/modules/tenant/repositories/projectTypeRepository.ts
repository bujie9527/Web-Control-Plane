import type { ApiResponse } from '@/core/types/api'
import type { ProjectType } from '../schemas/projectCreationReference'
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

export async function fetchProjectTypes(): Promise<ApiResponse<ProjectType[]>> {
  return request<ProjectType[]>('/api/config/project-types')
}

export async function fetchProjectTypeByCode(
  code: string
): Promise<ApiResponse<ProjectType | null>> {
  const res = await request<ProjectType[]>('/api/config/project-types')
  if (res.code !== 0 || !res.data) return { ...res, data: null }
  const found = res.data.find((p) => p.code === code && p.status === 'active') ?? null
  return { ...res, data: found }
}
