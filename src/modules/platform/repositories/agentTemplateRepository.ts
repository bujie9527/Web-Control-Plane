import type {
  AgentTemplate,
  AgentTemplateListParams,
  AgentTemplateStatus,
  ApiResponse,
  CloneAgentTemplatePayload,
  CreateAgentTemplatePayload,
  ListResult,
} from '../schemas/agentTemplate'
import { fetchGetDraftNodesReferencingAgent } from '@/modules/tenant/repositories/workflowPlanningSessionRepository'
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

export async function listTemplates(params: AgentTemplateListParams): Promise<ApiResponse<ListResult<AgentTemplate>>> {
  const q = new URLSearchParams()
  if (params.page != null) q.set('page', String(params.page))
  if (params.pageSize != null) q.set('pageSize', String(params.pageSize))
  if (params.keyword) q.set('keyword', params.keyword)
  if (params.status) q.set('status', params.status)
  if (params.category) q.set('category', params.category)
  if (params.domain) q.set('domain', params.domain)
  if (params.roleType) q.set('roleType', params.roleType)
  if (params.isSystemPreset !== undefined) q.set('isSystemPreset', String(params.isSystemPreset))
  if (params.platformType) q.set('platformType', params.platformType)
  const res = await request<{ items: AgentTemplate[]; total: number }>(`/api/agent-templates?${q.toString()}`)
  return {
    ...res,
    data: { items: res.data.items, total: res.data.total },
    meta: {
      ...res.meta,
      requestId: res.meta?.requestId ?? `req_${Date.now()}`,
      timestamp: res.meta?.timestamp ?? new Date().toISOString(),
      pagination: { page: params.page ?? 1, pageSize: params.pageSize ?? 20, total: res.data.total },
    },
  }
}

export async function getTemplateById(id: string): Promise<ApiResponse<AgentTemplate | null>> {
  return request<AgentTemplate | null>(`/api/agent-templates/${id}`)
}

export async function createTemplate(payload: CreateAgentTemplatePayload): Promise<ApiResponse<AgentTemplate>> {
  return request<AgentTemplate>('/api/agent-templates', { method: 'POST', body: payload })
}

export async function updateTemplate(
  id: string,
  payload: Partial<AgentTemplate>
): Promise<ApiResponse<AgentTemplate | null>> {
  return request<AgentTemplate | null>(`/api/agent-templates/${id}`, { method: 'PUT', body: payload })
}

export async function cloneTemplate(
  id: string,
  payload: CloneAgentTemplatePayload
): Promise<ApiResponse<AgentTemplate | null>> {
  return request<AgentTemplate | null>(`/api/agent-templates/${id}/clone`, { method: 'POST', body: payload })
}

export async function changeStatus(
  id: string,
  status: AgentTemplateStatus
): Promise<ApiResponse<AgentTemplate | null>> {
  return request<AgentTemplate | null>(`/api/agent-templates/${id}/status`, {
    method: 'PATCH',
    body: { status },
  })
}

export async function deleteTemplate(id: string): Promise<ApiResponse<{ success: boolean; reason?: string }>> {
  const res = await request<{ success: boolean }>(`/api/agent-templates/${id}`, { method: 'DELETE' })
  return { ...res, data: { success: res.data.success } }
}

export interface AgentTemplateReferences {
  workflowTemplateNodes: Array<{ nodeId: string; nodeKey: string; nodeName: string; templateId: string; templateName?: string }>
  workflowPlanningDraftNodes: Array<{
    draftId: string
    sessionId: string
    nodeKey: string
    nodeName: string
    draftVersion: number
  }>
}

/** 拉取引用该 Agent 的流程模板节点（后端 GET /api/workflow-templates/referencing-agent/:id 或等价） */
async function fetchWorkflowTemplateNodesReferencingAgent(
  agentTemplateId: string
): Promise<Array<{ nodeId: string; nodeKey: string; nodeName: string; templateId: string; templateName?: string }>> {
  try {
    const res = await fetch(
      `${API_BASE}/api/workflow-templates/referencing-agent/${encodeURIComponent(agentTemplateId)}`,
      { headers: { 'Content-Type': 'application/json' } }
    )
    const json = await parseResponseJson<{ code: number; data?: unknown[] }>(res)
    if (res.ok && json.code === 0 && Array.isArray(json.data)) return json.data as Array<{ nodeId: string; nodeKey: string; nodeName: string; templateId: string; templateName?: string }>
  } catch {
    // 后端未实现或非 JSON 时返回空
  }
  return []
}

export async function getAgentTemplateReferences(agentTemplateId: string): Promise<AgentTemplateReferences> {
  const [workflowTemplateNodes, workflowPlanningDraftNodes] = await Promise.all([
    fetchWorkflowTemplateNodesReferencingAgent(agentTemplateId),
    fetchGetDraftNodesReferencingAgent(agentTemplateId),
  ])
  return {
    workflowTemplateNodes,
    workflowPlanningDraftNodes,
  }
}
