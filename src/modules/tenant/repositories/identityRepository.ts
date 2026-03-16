import type { ApiResponse, ListResult } from '@/core/types/api'
import type { Identity, IdentityListParams, IdentityStatus } from '../schemas/identity'
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

export async function fetchIdentityList(
  params: IdentityListParams
): Promise<ApiResponse<ListResult<Identity>>> {
  const q = new URLSearchParams()
  q.set('tenantId', params.tenantId)
  if (params.page != null) q.set('page', String(params.page))
  if (params.pageSize != null) q.set('pageSize', String(params.pageSize))
  if (params.keyword) q.set('keyword', params.keyword)
  if (params.status) q.set('status', params.status)
  if (params.type) q.set('type', params.type)
  const res = await request<{ items: Identity[]; total: number }>(`/api/identities?${q.toString()}`)
  return {
    ...res,
    meta: {
      ...res.meta,
      pagination: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 10,
        total: res.data.total,
      },
    },
  }
}

export async function fetchIdentityDetail(id: string): Promise<ApiResponse<Identity | null>> {
  return request<Identity | null>(`/api/identities/${id}`)
}

export async function createIdentity(
  payload: Partial<Identity> & { name: string; tenantId: string }
): Promise<ApiResponse<Identity>> {
  return request<Identity>('/api/identities', { method: 'POST', body: payload })
}

export async function updateIdentity(
  id: string,
  payload: Partial<Identity>
): Promise<ApiResponse<Identity | null>> {
  return request<Identity | null>(`/api/identities/${id}`, { method: 'PUT', body: payload })
}

export async function deleteIdentity(id: string): Promise<ApiResponse<boolean>> {
  return request<boolean>(`/api/identities/${id}`, { method: 'DELETE' })
}

export async function patchIdentityStatus(
  id: string,
  status: IdentityStatus
): Promise<ApiResponse<Identity | null>> {
  return request<Identity | null>(`/api/identities/${id}/status`, {
    method: 'PATCH',
    body: { status },
  })
}
