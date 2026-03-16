import type { ApiResponse, ListResult } from '@/core/types/api'
import type { Project, ProjectListParams, ProjectStatus } from '../schemas/project'
import { parseResponseJson } from '@/core/api/safeParseResponse'

const API_BASE = typeof window !== 'undefined' ? '' : 'http://localhost:3001'

async function request<T>(
  url: string,
  options?: { method?: string; body?: unknown; headers?: HeadersInit }
): Promise<ApiResponse<T>> {
  const { body, method, headers: optHeaders } = options ?? {}
  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(optHeaders as Record<string, string>) },
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

export async function fetchProjectList(params: ProjectListParams): Promise<ApiResponse<ListResult<Project>>> {
  const q = new URLSearchParams()
  if (params.page != null) q.set('page', String(params.page))
  if (params.pageSize != null) q.set('pageSize', String(params.pageSize))
  if (params.keyword) q.set('keyword', params.keyword)
  if (params.status) q.set('status', params.status)
  const res = await request<{ items: Project[]; total: number }>(`/api/projects?${q.toString()}`)
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

export async function fetchProjectDetail(id: string): Promise<ApiResponse<Project | null>> {
  return request<Project | null>(`/api/projects/${id}`)
}

export async function createProject(
  payload: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> & {
    tenantId: string
    name: string
    ownerId: string
    status?: ProjectStatus
    [key: string]: unknown
  }
): Promise<ApiResponse<Project>> {
  return request<Project>('/api/projects', { method: 'POST', body: payload })
}

export async function updateProject(
  id: string,
  payload: Partial<Project>
): Promise<ApiResponse<Project | null>> {
  return request<Project | null>(`/api/projects/${id}`, { method: 'PUT', body: payload })
}

export async function deleteProject(id: string): Promise<ApiResponse<boolean>> {
  return request<boolean>(`/api/projects/${id}`, { method: 'DELETE' })
}

export async function patchProjectStatus(
  id: string,
  status: ProjectStatus
): Promise<ApiResponse<Project | null>> {
  return request<Project | null>(`/api/projects/${id}/status`, {
    method: 'PATCH',
    body: { status },
  })
}
