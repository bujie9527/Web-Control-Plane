import type {
  ApiResponse,
  ListResult,
  PlatformCapability,
  PlatformCapabilityListParams,
  PlatformCapabilityStatus,
} from '@/core/schemas/platformCapability'
import { parseResponseJson } from '@/core/api/safeParseResponse'

const API_BASE = typeof window !== 'undefined' ? '' : 'http://localhost:3001'

async function request<T>(
  url: string,
  options?: { method?: string; body?: unknown }
): Promise<ApiResponse<T>> {
  const { body, method = 'GET' } = options ?? {}
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

export async function fetchCapabilities(
  params?: PlatformCapabilityListParams
): Promise<ApiResponse<ListResult<PlatformCapability>>> {
  const q = new URLSearchParams()
  if (params?.status) q.set('status', params.status)
  if (params?.protocolType) q.set('protocolType', params.protocolType)
  const query = q.toString()
  return request<ListResult<PlatformCapability>>(
    `/api/platform-capabilities${query ? `?${query}` : ''}`
  )
}

export async function fetchCapabilityByCode(
  code: string
): Promise<ApiResponse<PlatformCapability>> {
  return request<PlatformCapability>(`/api/platform-capabilities/${code}`)
}

export async function patchCapabilityStatus(
  id: string,
  status: PlatformCapabilityStatus
): Promise<ApiResponse<PlatformCapability>> {
  return request<PlatformCapability>(`/api/platform-capabilities/${id}/status`, {
    method: 'PATCH',
    body: { status },
  })
}
