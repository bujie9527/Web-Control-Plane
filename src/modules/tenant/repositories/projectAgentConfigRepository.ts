import { parseResponseJson } from '@/core/api/safeParseResponse'
import type {
  ProjectAgentConfig,
  ProjectAgentConfigApiResponse,
  UpsertProjectAgentConfigPayload,
} from '../schemas/projectAgentConfig'

const API_BASE = typeof window !== 'undefined' ? '' : 'http://localhost:3001'

async function request<T>(
  url: string,
  options?: { method?: string; body?: unknown }
): Promise<ProjectAgentConfigApiResponse<T>> {
  const res = await fetch(`${API_BASE}${url}`, {
    method: options?.method,
    headers: { 'Content-Type': 'application/json' },
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
  })
  const json = await parseResponseJson<{ code: number; message: string; data: T; meta?: unknown }>(res)
  if (res.ok && json.code === 0) {
    return {
      code: json.code,
      message: json.message,
      data: json.data,
      meta: json.meta as ProjectAgentConfigApiResponse<T>['meta'],
    }
  }
  throw new Error(json.message || `HTTP ${res.status}`)
}

export function listProjectAgentConfigs(projectId: string) {
  return request<ProjectAgentConfig[]>(`/api/projects/${encodeURIComponent(projectId)}/agent-configs`)
}

export function getProjectAgentConfig(projectId: string, agentTemplateId: string) {
  return request<ProjectAgentConfig | null>(
    `/api/projects/${encodeURIComponent(projectId)}/agent-configs/${encodeURIComponent(agentTemplateId)}`
  )
}

export function upsertProjectAgentConfig(
  projectId: string,
  agentTemplateId: string,
  payload: UpsertProjectAgentConfigPayload
) {
  return request<ProjectAgentConfig>(
    `/api/projects/${encodeURIComponent(projectId)}/agent-configs/${encodeURIComponent(agentTemplateId)}`,
    { method: 'PUT', body: payload }
  )
}

export function deleteProjectAgentConfig(projectId: string, agentTemplateId: string) {
  return request<{ success: boolean }>(
    `/api/projects/${encodeURIComponent(projectId)}/agent-configs/${encodeURIComponent(agentTemplateId)}`,
    { method: 'DELETE' }
  )
}
