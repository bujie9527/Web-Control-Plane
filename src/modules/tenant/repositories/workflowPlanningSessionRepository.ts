import type { ApiResponse } from '@/core/types/api'
import type {
  WorkflowPlanningSession,
  WorkflowPlanningDraft,
  WorkflowPlanningMessage,
  PlanningSessionStatus,
  PlanningSessionListParams,
} from '../schemas/workflowPlanningSession'
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

export async function fetchListPlanningSessions(
  params: PlanningSessionListParams
): Promise<ApiResponse<{ items: WorkflowPlanningSession[]; total: number }>> {
  const q = new URLSearchParams()
  if (params.page != null) q.set('page', String(params.page))
  if (params.pageSize != null) q.set('pageSize', String(params.pageSize))
  if (params.scopeType) q.set('scopeType', params.scopeType)
  if (params.tenantId) q.set('tenantId', params.tenantId)
  if (params.status) q.set('status', params.status)
  if (params.projectTypeId) q.set('projectTypeId', params.projectTypeId)
  if (params.deliverableMode) q.set('deliverableMode', params.deliverableMode)
  if (params.sourceType) q.set('sourceType', params.sourceType)
  return request<{ items: WorkflowPlanningSession[]; total: number }>(
    `/api/planning-sessions?${q.toString()}`
  )
}

export async function fetchGetPlanningSessionById(
  id: string
): Promise<ApiResponse<WorkflowPlanningSession | null>> {
  return request<WorkflowPlanningSession | null>(`/api/planning-sessions/${id}`)
}

export async function fetchCreatePlanningSession(
  payload: Omit<WorkflowPlanningSession, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ApiResponse<WorkflowPlanningSession>> {
  return request<WorkflowPlanningSession>('/api/planning-sessions', {
    method: 'POST',
    body: payload,
  })
}

export async function fetchUpdatePlanningSessionStatus(
  id: string,
  status: PlanningSessionStatus
): Promise<ApiResponse<WorkflowPlanningSession | null>> {
  return request<WorkflowPlanningSession | null>(`/api/planning-sessions/${id}/status`, {
    method: 'PUT',
    body: { status },
  })
}

export async function fetchSetCurrentDraft(
  sessionId: string,
  draftId: string
): Promise<ApiResponse<WorkflowPlanningSession | null>> {
  return request<WorkflowPlanningSession | null>(`/api/planning-sessions/${sessionId}/current-draft`, {
    method: 'PUT',
    body: { draftId },
  })
}

export async function fetchCreatePlanningDraft(
  payload: Omit<WorkflowPlanningDraft, 'id' | 'createdAt'> & { sessionId: string }
): Promise<ApiResponse<WorkflowPlanningDraft>> {
  const { sessionId, ...rest } = payload
  return request<WorkflowPlanningDraft>(`/api/planning-sessions/${sessionId}/drafts`, {
    method: 'POST',
    body: rest,
  })
}

export async function fetchListPlanningDrafts(
  sessionId: string
): Promise<ApiResponse<WorkflowPlanningDraft[]>> {
  return request<WorkflowPlanningDraft[]>(`/api/planning-sessions/${sessionId}/drafts`)
}

export async function fetchGetPlanningDraftById(
  id: string
): Promise<ApiResponse<WorkflowPlanningDraft | null>> {
  return request<WorkflowPlanningDraft | null>(`/api/planning-drafts/${id}`)
}

export async function fetchAddPlanningMessage(
  payload: Omit<WorkflowPlanningMessage, 'id' | 'createdAt'>
): Promise<ApiResponse<WorkflowPlanningMessage>> {
  return request<WorkflowPlanningMessage>(
    `/api/planning-sessions/${payload.sessionId}/messages`,
    {
      method: 'POST',
      body: payload,
    }
  )
}

export async function fetchListPlanningMessages(
  sessionId: string
): Promise<ApiResponse<WorkflowPlanningMessage[]>> {
  return request<WorkflowPlanningMessage[]>(`/api/planning-sessions/${sessionId}/messages`)
}

export async function fetchDeletePlanningSession(id: string): Promise<ApiResponse<boolean>> {
  return request<boolean>(`/api/planning-sessions/${id}`, { method: 'DELETE' })
}

export async function fetchGetDraftNodesReferencingAgent(agentTemplateId: string) {
  const res = await request<Array<{ draftId: string; sessionId: string; nodeKey: string; nodeName: string; draftVersion: number }>>(
    `/api/planning-drafts/referencing-agent/${encodeURIComponent(agentTemplateId)}`
  )
  return res.data
}
