import type { ApiResponse } from '@/core/types/api'
import type { WorkflowInstance } from '../schemas/workflowExecution'
import type { CreateWorkflowInstancePayload } from '../schemas/workflowExecution'
import type { WorkflowInstanceListItem } from '../schemas/workflowExecution'
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

export async function fetchInstanceList(
  projectId: string
): Promise<ApiResponse<WorkflowInstance[]>> {
  return request<WorkflowInstance[]>(
    `/api/workflow-instances?projectId=${encodeURIComponent(projectId)}`
  )
}

export async function fetchInstanceDetail(
  id: string
): Promise<ApiResponse<WorkflowInstance | null>> {
  return request<WorkflowInstance | null>(`/api/workflow-instances/${id}`)
}

export async function fetchInstanceListForTenant(
  tenantId: string
): Promise<ApiResponse<WorkflowInstanceListItem[]>> {
  const res = await request<WorkflowInstance[]>(
    `/api/workflow-instances?tenantId=${encodeURIComponent(tenantId)}`
  )
  return { ...res, data: res.data as unknown as WorkflowInstanceListItem[] }
}

export async function createInstanceRepo(
  payload: CreateWorkflowInstancePayload
): Promise<ApiResponse<WorkflowInstance>> {
  return request<WorkflowInstance>('/api/workflow-instances', {
    method: 'POST',
    body: {
      projectId: payload.projectId,
      templateId: payload.templateId,
      identityId: payload.identityId,
      sourceType: payload.sourceType,
    },
  })
}

export async function updateInstance(
  id: string,
  payload: { status?: string; currentNodeKey?: string }
): Promise<ApiResponse<WorkflowInstance | null>> {
  return request<WorkflowInstance | null>(`/api/workflow-instances/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

/** 按流程模板 ID 列出实例（用于引用检查） */
export async function fetchInstanceListByTemplateId(
  templateId: string
): Promise<ApiResponse<WorkflowInstance[]>> {
  return request<WorkflowInstance[]>(
    `/api/workflow-instances?workflowTemplateId=${encodeURIComponent(templateId)}`
  )
}
