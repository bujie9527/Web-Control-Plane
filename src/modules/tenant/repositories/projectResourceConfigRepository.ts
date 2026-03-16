/**
 * 项目资源配置 Repository — 对应 /api/projects/:id/resource-configs
 * 替换原 mock 版本，接入真实 API
 */
import type { ApiResponse } from '@/core/types/api'
import type {
  ProjectResourceConfig,
  CreateProjectResourceConfigPayload,
  UpdateProjectResourceConfigPayload,
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

/** 获取项目所有资源配置 */
export async function fetchResourceConfigsByProjectId(
  projectId: string
): Promise<ApiResponse<ProjectResourceConfig[]>> {
  return request<ProjectResourceConfig[]>(`/api/projects/${projectId}/resource-configs`)
}

/** 新增资源配置 */
export async function createResourceConfig(
  projectId: string,
  payload: Omit<CreateProjectResourceConfigPayload, 'projectId'>
): Promise<ApiResponse<ProjectResourceConfig>> {
  return request<ProjectResourceConfig>(`/api/projects/${projectId}/resource-configs`, {
    method: 'POST',
    body: payload,
  })
}

/** 更新资源配置 */
export async function updateResourceConfig(
  projectId: string,
  configId: string,
  payload: UpdateProjectResourceConfigPayload
): Promise<ApiResponse<ProjectResourceConfig>> {
  return request<ProjectResourceConfig>(
    `/api/projects/${projectId}/resource-configs/${encodeURIComponent(configId)}`,
    { method: 'PUT', body: payload }
  )
}

/** 删除资源配置 */
export async function deleteResourceConfig(
  projectId: string,
  configId: string
): Promise<ApiResponse<{ success: boolean }>> {
  return request<{ success: boolean }>(
    `/api/projects/${projectId}/resource-configs/${encodeURIComponent(configId)}`,
    { method: 'DELETE' }
  )
}

/** 批量替换（创建向导用） */
export async function replaceAllResourceConfigs(
  projectId: string,
  items: Omit<CreateProjectResourceConfigPayload, 'projectId'>[]
): Promise<ApiResponse<ProjectResourceConfig[]>> {
  return request<ProjectResourceConfig[]>(`/api/projects/${projectId}/resource-configs/replace-all`, {
    method: 'POST',
    body: { items },
  })
}
