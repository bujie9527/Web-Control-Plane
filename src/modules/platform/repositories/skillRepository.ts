import type {
  ApiResponse,
  ListResult,
  Skill,
  SkillListParams,
  SkillStatus,
} from '../schemas/skill'
import { parseResponseJson } from '@/core/api/safeParseResponse'

const API_BASE = typeof window !== 'undefined' ? '' : 'http://localhost:3001'

async function request<T>(url: string, options?: { method?: string; body?: unknown }): Promise<ApiResponse<T>> {
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

export async function listSkills(params: SkillListParams): Promise<ApiResponse<ListResult<Skill>>> {
  const q = new URLSearchParams()
  if (params.page != null) q.set('page', String(params.page))
  if (params.pageSize != null) q.set('pageSize', String(params.pageSize))
  if (params.keyword) q.set('keyword', params.keyword)
  if (params.status) q.set('status', params.status)
  if (params.category) q.set('category', params.category)
  return request<{ items: Skill[]; total: number }>(`/api/skills?${q.toString()}`)
}

export async function getSkillById(id: string): Promise<ApiResponse<Skill | null>> {
  return request<Skill | null>(`/api/skills/${id}`)
}

export async function createSkill(
  payload: Omit<Skill, 'id' | 'createdAt' | 'updatedAt' | 'isSystemPreset'>
): Promise<ApiResponse<Skill>> {
  const body = {
    name: payload.name,
    nameZh: payload.nameZh,
    code: payload.code,
    category: payload.category,
    executionType: payload.executionType,
    description: payload.description,
    version: payload.version,
    status: payload.status,
    openClawSpec: payload.openClawSpec,
  }
  return request<Skill>('/api/skills', { method: 'POST', body })
}

export async function updateSkill(id: string, payload: Partial<Skill>): Promise<ApiResponse<Skill | null>> {
  return request<Skill | null>(`/api/skills/${id}`, { method: 'PUT', body: payload })
}

export async function changeStatus(id: string, status: SkillStatus): Promise<ApiResponse<Skill | null>> {
  return request<Skill | null>(`/api/skills/${id}/status`, { method: 'PATCH', body: { status } })
}

export async function deleteSkill(id: string): Promise<ApiResponse<{ success: boolean; reason?: string }>> {
  const res = await request<{ success: boolean }>(`/api/skills/${id}`, { method: 'DELETE' })
  return { ...res, data: { success: res.data.success } }
}
