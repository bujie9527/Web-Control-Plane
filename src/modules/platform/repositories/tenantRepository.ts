import type { ApiResponse, ListResult } from '@/core/types/api'
import type { Tenant, TenantDetail, TenantListParams, TenantStatus } from '../schemas/tenant'
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

export async function fetchTenantList(
  params: TenantListParams
): Promise<ApiResponse<ListResult<Tenant>>> {
  const q = new URLSearchParams()
  if (params.page != null) q.set('page', String(params.page))
  if (params.pageSize != null) q.set('pageSize', String(params.pageSize))
  if (params.keyword) q.set('keyword', params.keyword)
  if (params.status) q.set('status', params.status)
  if (params.plan) q.set('plan', params.plan)
  const res = await request<{ items: Tenant[]; total: number }>(`/api/tenants?${q.toString()}`)
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

export async function fetchTenantDetail(
  id: string
): Promise<ApiResponse<TenantDetail | null>> {
  const res = await request<Tenant | null>(`/api/tenants/${id}`)
  const data = res.data
    ? ({ ...res.data, quotaDetail: [], recentMembers: [], recentProjects: [], recentAudit: [] } as TenantDetail)
    : null
  return { ...res, data }
}

export async function createTenant(
  payload: { name: string; code?: string; status?: TenantStatus }
): Promise<ApiResponse<Tenant>> {
  return request<Tenant>('/api/tenants', { method: 'POST', body: payload })
}

export async function updateTenant(
  id: string,
  payload: Partial<Tenant>
): Promise<ApiResponse<Tenant | null>> {
  return request<Tenant | null>(`/api/tenants/${id}`, { method: 'PUT', body: payload })
}

export async function deleteTenant(id: string): Promise<ApiResponse<boolean>> {
  return request<boolean>(`/api/tenants/${id}`, { method: 'DELETE' })
}

export async function patchTenantStatus(
  id: string,
  status: TenantStatus
): Promise<ApiResponse<Tenant | null>> {
  return request<Tenant | null>(`/api/tenants/${id}/status`, {
    method: 'PATCH',
    body: { status },
  })
}
