import type { ApiResponse, ListResult } from '@/core/types/api'
import type { Terminal } from '../schemas/terminal'
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

export interface TerminalListParams {
  tenantId: string
  page?: number
  pageSize?: number
  keyword?: string
  type?: string
  typeCategory?: string
  status?: string
}

export async function fetchTerminalList(
  params: TerminalListParams
): Promise<ApiResponse<ListResult<Terminal>>> {
  const q = new URLSearchParams()
  q.set('tenantId', params.tenantId)
  if (params.page != null) q.set('page', String(params.page))
  if (params.pageSize != null) q.set('pageSize', String(params.pageSize))
  if (params.keyword) q.set('keyword', params.keyword)
  if (params.type) q.set('type', params.type)
  if (params.typeCategory) q.set('typeCategory', params.typeCategory)
  if (params.status) q.set('status', params.status)
  const res = await request<{ items: Terminal[]; total: number }>(`/api/terminals?${q.toString()}`)
  return {
    ...res,
    meta: {
      ...res.meta,
      pagination: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        total: res.data.total,
      },
    },
  }
}

export async function fetchTerminalDetail(id: string): Promise<ApiResponse<Terminal | null>> {
  return request<Terminal | null>(`/api/terminals/${id}`)
}

export async function createTerminal(tenantId: string, payload: {
  name: string
  type: string
  typeCategory?: string
  identityId?: string
  credentialsJson?: string
  configJson?: string
  linkedProjectIds?: string[]
  notes?: string
}): Promise<ApiResponse<Terminal>> {
  return request<Terminal>('/api/terminals', {
    method: 'POST',
    body: { ...payload, tenantId },
  })
}

export async function updateTerminal(id: string, payload: Partial<{
  name: string
  identityId: string | null
  status: string
  credentialsJson: string
  configJson: string
  linkedProjectIds: string[]
  notes: string
}>): Promise<ApiResponse<Terminal | null>> {
  return request<Terminal | null>(`/api/terminals/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

export async function deleteTerminal(id: string): Promise<ApiResponse<{ success: boolean }>> {
  return request<{ success: boolean }>(`/api/terminals/${id}`, { method: 'DELETE' })
}

export async function patchTerminalStatus(id: string, status: string): Promise<ApiResponse<Terminal | null>> {
  return request<Terminal | null>(`/api/terminals/${id}/status`, {
    method: 'PATCH',
    body: { status },
  })
}

export async function testConnectionTerminal(_payload: {
  tenantId: string
  type: string
  credentialsJson?: string
  configJson?: string
}): Promise<ApiResponse<{ success: boolean; message?: string }>> {
  return request<{ success: boolean; message?: string }>('/api/terminals/test-connection', {
    method: 'POST',
    body: _payload,
  })
}

export async function testTerminalById(id: string): Promise<ApiResponse<Terminal | null>> {
  return request<Terminal | null>(`/api/terminals/${id}/test`, { method: 'POST' })
}
