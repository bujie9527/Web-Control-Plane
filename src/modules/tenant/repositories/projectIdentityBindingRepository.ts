/**
 * 项目身份绑定 Repository — 对应 /api/projects/:id/identity-bindings
 */
import type { ApiResponse } from '@/core/types/api'
import type { ProjectIdentityBinding } from '../schemas/projectSubdomain'
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
  if (res.ok && json.code === 0) return { code: 0, message: json.message, data: json.data, meta: json.meta as ApiResponse<T>['meta'] }
  throw new Error(json.message || `HTTP ${res.status}`)
}

/** 获取项目所有身份绑定 */
export async function fetchProjectIdentityBindings(
  projectId: string
): Promise<ApiResponse<ProjectIdentityBinding[]>> {
  return request<ProjectIdentityBinding[]>(`/api/projects/${projectId}/identity-bindings`)
}

/** 新增身份绑定 */
export async function addProjectIdentityBinding(
  projectId: string,
  payload: { identityId: string; isDefault?: boolean }
): Promise<ApiResponse<ProjectIdentityBinding>> {
  return request<ProjectIdentityBinding>(`/api/projects/${projectId}/identity-bindings`, {
    method: 'POST',
    body: payload,
  })
}

/** 删除身份绑定 */
export async function removeProjectIdentityBinding(
  projectId: string,
  identityId: string
): Promise<ApiResponse<{ success: boolean }>> {
  return request<{ success: boolean }>(
    `/api/projects/${projectId}/identity-bindings/${encodeURIComponent(identityId)}`,
    { method: 'DELETE' }
  )
}

/** 设置默认身份 */
export async function setDefaultProjectIdentityBinding(
  projectId: string,
  identityId: string
): Promise<ApiResponse<{ success: boolean }>> {
  return request<{ success: boolean }>(
    `/api/projects/${projectId}/identity-bindings/${encodeURIComponent(identityId)}/set-default`,
    { method: 'PATCH' }
  )
}
