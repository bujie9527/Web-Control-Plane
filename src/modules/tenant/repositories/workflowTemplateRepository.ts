import type { ApiResponse } from '@/core/types/api'
import type { WorkflowTemplate, WorkflowTemplateStatus } from '../schemas/workflowExecution'
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

export interface WorkflowTemplateListParams {
  page?: number
  pageSize?: number
  keyword?: string
  tenantId?: string
  scopeType?: 'system' | 'tenant'
  status?: WorkflowTemplateStatus
  projectType?: string
  goalType?: string
  deliverableMode?: string
  planningMode?: 'manual' | 'ai_assisted' | 'hybrid'
  isSystemPreset?: boolean
}

export async function fetchTemplateList(tenantId: string): Promise<ApiResponse<WorkflowTemplate[]>> {
  const res = await request<{ items: WorkflowTemplate[]; total: number }>(
    `/api/workflow-templates?tenantId=${encodeURIComponent(tenantId)}&page=1&pageSize=999`
  )
  return { ...res, data: res.data.items }
}

export async function fetchTemplateDetail(id: string): Promise<ApiResponse<WorkflowTemplate | null>> {
  return request<WorkflowTemplate | null>(`/api/workflow-templates/${id}`)
}

export async function fetchListWorkflowTemplates(
  params: WorkflowTemplateListParams
): Promise<ApiResponse<{ items: WorkflowTemplate[]; total: number }>> {
  const q = new URLSearchParams()
  if (params.tenantId) q.set('tenantId', params.tenantId)
  if (params.page != null) q.set('page', String(params.page))
  if (params.pageSize != null) q.set('pageSize', String(params.pageSize))
  if (params.keyword) q.set('keyword', params.keyword)
  if (params.scopeType) q.set('scopeType', params.scopeType)
  if (params.status) q.set('status', params.status)
  return request<{ items: WorkflowTemplate[]; total: number }>(`/api/workflow-templates?${q.toString()}`)
}

export async function fetchGetWorkflowTemplateById(
  id: string
): Promise<ApiResponse<WorkflowTemplate | null>> {
  return request<WorkflowTemplate | null>(`/api/workflow-templates/${id}`)
}

export async function fetchCreateWorkflowTemplate(
  payload: {
    name: string
    code: string
    scopeType: 'system' | 'tenant'
    tenantId?: string
    supportedProjectTypeId: string
    supportedGoalTypeIds: string[]
    supportedDeliverableModes: string[]
    description?: string
    status?: WorkflowTemplateStatus
    planningMode?: string
    [k: string]: unknown
  }
): Promise<ApiResponse<WorkflowTemplate>> {
  return request<WorkflowTemplate>('/api/workflow-templates', { method: 'POST', body: payload })
}

export async function fetchUpdateWorkflowTemplate(
  id: string,
  payload: Partial<WorkflowTemplate>
): Promise<ApiResponse<WorkflowTemplate | null>> {
  return request<WorkflowTemplate | null>(`/api/workflow-templates/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

export async function fetchCloneWorkflowTemplateToTenant(
  id: string,
  tenantId: string
): Promise<ApiResponse<WorkflowTemplate | null>> {
  return request<WorkflowTemplate | null>(`/api/workflow-templates/${id}/clone`, {
    method: 'POST',
    body: { tenantId },
  })
}

export async function fetchChangeWorkflowTemplateStatus(
  id: string,
  status: WorkflowTemplate['status']
): Promise<ApiResponse<WorkflowTemplate | null>> {
  return request<WorkflowTemplate | null>(`/api/workflow-templates/${id}/status`, {
    method: 'PATCH',
    body: { status },
  })
}

export async function fetchDeleteWorkflowTemplate(
  id: string
): Promise<ApiResponse<{ success: boolean; reason?: string }>> {
  return request<{ success: boolean; reason?: string }>(`/api/workflow-templates/${id}`, {
    method: 'DELETE',
  })
}
