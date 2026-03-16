/**
 * 项目交付标的 Repository — 对应 /api/projects/:id/deliverables
 * 替换原 mock 版本，接入真实 API
 */
import type { ApiResponse } from '@/core/types/api'
import type {
  ProjectDeliverable,
  CreateProjectDeliverablePayload,
  UpdateProjectDeliverablePayload,
} from '../schemas/projectSubdomain'
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
  const json = await parseResponseJson<{ code: number; message: string; data: T }>(res)
  if (res.ok && json.code === 0) return { code: 0, message: json.message, data: json.data }
  throw new Error(json.message || `HTTP ${res.status}`)
}

/** 获取项目所有交付标的 */
export async function fetchDeliverablesByProjectId(
  projectId: string
): Promise<ApiResponse<ProjectDeliverable[]>> {
  return request<ProjectDeliverable[]>(`/api/projects/${projectId}/deliverables`)
}

/** 新增交付标的 */
export async function createDeliverable(
  projectId: string,
  payload: Omit<CreateProjectDeliverablePayload, 'projectId'>
): Promise<ApiResponse<ProjectDeliverable>> {
  return request<ProjectDeliverable>(`/api/projects/${projectId}/deliverables`, {
    method: 'POST',
    body: payload,
  })
}

/** 更新交付标的 */
export async function updateDeliverable(
  projectId: string,
  deliverableId: string,
  payload: UpdateProjectDeliverablePayload
): Promise<ApiResponse<ProjectDeliverable>> {
  return request<ProjectDeliverable>(
    `/api/projects/${projectId}/deliverables/${encodeURIComponent(deliverableId)}`,
    { method: 'PUT', body: payload }
  )
}

/** 删除交付标的 */
export async function deleteDeliverable(
  projectId: string,
  deliverableId: string
): Promise<ApiResponse<{ success: boolean }>> {
  return request<{ success: boolean }>(
    `/api/projects/${projectId}/deliverables/${encodeURIComponent(deliverableId)}`,
    { method: 'DELETE' }
  )
}

/** 批量替换（创建向导用） */
export async function replaceAllDeliverables(
  projectId: string,
  items: Omit<CreateProjectDeliverablePayload, 'projectId'>[]
): Promise<ApiResponse<ProjectDeliverable[]>> {
  return request<ProjectDeliverable[]>(`/api/projects/${projectId}/deliverables/replace-all`, {
    method: 'POST',
    body: { items },
  })
}
