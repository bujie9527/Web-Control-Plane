import type { ApiResponse } from '@/core/types/api'
import { parseResponseJson } from '@/core/api/safeParseResponse'

const API_BASE = typeof window !== 'undefined' ? '' : 'http://localhost:3001'

export interface TaskRecord {
  id: string
  projectId: string
  workflowInstanceId?: string
  workflowInstanceNodeId?: string
  title: string
  status: string
  createdAt: string
  updatedAt: string
}

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

export async function fetchTasksByProjectId(
  projectId: string
): Promise<ApiResponse<TaskRecord[]>> {
  return request<TaskRecord[]>(`/api/tasks?projectId=${encodeURIComponent(projectId)}`)
}

export async function fetchTaskById(id: string): Promise<ApiResponse<TaskRecord | null>> {
  return request<TaskRecord | null>(`/api/tasks/${id}`)
}

export async function fetchCreateTask(payload: {
  projectId: string
  title: string
  workflowInstanceId?: string
  workflowInstanceNodeId?: string
  status?: string
}): Promise<ApiResponse<TaskRecord>> {
  return request<TaskRecord>('/api/tasks', { method: 'POST', body: payload })
}

export async function fetchUpdateTaskStatus(
  id: string,
  status: string
): Promise<ApiResponse<TaskRecord>> {
  return request<TaskRecord>(`/api/tasks/${id}`, {
    method: 'PATCH',
    body: { status },
  })
}
