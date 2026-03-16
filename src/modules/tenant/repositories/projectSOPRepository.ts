import type { ApiResponse } from '@/core/types/api'
import type { ProjectSOP } from '../schemas/projectDomain'
import { parseResponseJson } from '@/core/api/safeParseResponse'

const API_BASE = typeof window !== 'undefined' ? '' : 'http://localhost:3001'

async function request<T>(
  url: string,
  options?: { method?: string; body?: unknown }
): Promise<ApiResponse<T>> {
  const { body, method } = options ?? {}
  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const json = await parseResponseJson<{ code: number; message: string; data: T; meta?: unknown }>(res)
  if (res.ok && json.code === 0) {
    return {
      code: json.code,
      message: json.message,
      data: json.data,
      meta: json.meta as ApiResponse<T>['meta'],
    }
  }
  throw new Error(json.message || `HTTP ${res.status}`)
}

export async function fetchSOPByProjectId(
  projectId: string
): Promise<ApiResponse<ProjectSOP | null>> {
  return request<ProjectSOP | null>(`/api/projects/${projectId}/sop`)
}

export async function fetchUpdateProjectSOP(
  projectId: string,
  payload: { sopRaw: string }
): Promise<ApiResponse<ProjectSOP>> {
  return request<ProjectSOP>(`/api/projects/${projectId}/sop`, {
    method: 'PUT',
    body: payload,
  })
}
