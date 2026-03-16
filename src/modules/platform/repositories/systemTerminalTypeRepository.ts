import type {
  ApiResponse,
  ListResult,
  SystemTerminalType,
  SystemTerminalTypeListParams,
  SystemTerminalTypeUsage,
} from '../schemas/systemTerminalType'
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

export async function fetchSystemTerminalTypeList(
  params: SystemTerminalTypeListParams
): Promise<ApiResponse<ListResult<SystemTerminalType>>> {
  const q = new URLSearchParams()
  if (params.page != null) q.set('page', String(params.page))
  if (params.pageSize != null) q.set('pageSize', String(params.pageSize))
  if (params.keyword) q.set('keyword', params.keyword)
  if (params.typeCategory) q.set('typeCategory', params.typeCategory)
  if (params.status) q.set('status', params.status)
  return request<{ items: SystemTerminalType[]; total: number }>(
    `/api/system-terminal-types?${q.toString()}`
  )
}

export async function fetchSystemTerminalTypeById(
  id: string
): Promise<ApiResponse<SystemTerminalType | null>> {
  return request<SystemTerminalType | null>(`/api/system-terminal-types/${id}`)
}

export async function fetchSystemTerminalTypeUsage(
  id: string
): Promise<ApiResponse<SystemTerminalTypeUsage>> {
  return request<SystemTerminalTypeUsage>(`/api/system-terminal-types/${id}/usage`)
}

export async function createSystemTerminalType(
  payload: Omit<SystemTerminalType, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ApiResponse<SystemTerminalType>> {
  return request<SystemTerminalType>('/api/system-terminal-types', {
    method: 'POST',
    body: {
      ...payload,
      supportedProjectTypeIds: payload.supportedProjectTypeIds ?? [],
      capabilityTags: payload.capabilityTags ?? [],
    },
  })
}

export async function updateSystemTerminalType(
  id: string,
  payload: Partial<Omit<SystemTerminalType, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<ApiResponse<SystemTerminalType | null>> {
  return request<SystemTerminalType | null>(`/api/system-terminal-types/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

export async function changeSystemTerminalTypeStatus(
  id: string,
  status: string
): Promise<ApiResponse<SystemTerminalType | null>> {
  return request<SystemTerminalType | null>(`/api/system-terminal-types/${id}/status`, {
    method: 'PATCH',
    body: { status },
  })
}

export async function deleteSystemTerminalType(
  id: string
): Promise<ApiResponse<{ success: boolean }>> {
  return request<{ success: boolean }>(`/api/system-terminal-types/${id}`, { method: 'DELETE' })
}
