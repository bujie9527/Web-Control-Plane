import type { ApiResponse } from '@/core/types/api'

export interface ScheduledTaskItem {
  id: string
  name: string
  targetType: string
  status: string
  nextRunAt?: string | null
  updatedAt: string
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  const json = (await res.json()) as ApiResponse<T>
  if (!res.ok || json.code !== 0) throw new Error(json.message || '请求失败')
  return json.data as T
}

export async function listScheduledTasks(tenantId: string): Promise<ScheduledTaskItem[]> {
  return request<ScheduledTaskItem[]>(`/api/scheduled-tasks?tenantId=${encodeURIComponent(tenantId)}`)
}

export async function runTaskNow(id: string): Promise<void> {
  await request(`/api/scheduled-tasks/${id}/run`, { method: 'POST' })
}

export async function patchTaskStatus(id: string, status: 'active' | 'paused'): Promise<void> {
  await request(`/api/scheduled-tasks/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
}

