import type { ApiResponse } from '@/core/types/api'
import type { WorkflowTemplateNode } from '../schemas/workflowExecution'
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

export async function fetchNodesByTemplateId(
  templateId: string
): Promise<ApiResponse<WorkflowTemplateNode[]>> {
  return request<WorkflowTemplateNode[]>(`/api/workflow-templates/${templateId}/nodes`)
}

export type UpdateTemplateNodePayload = Partial<WorkflowTemplateNode>

export async function fetchUpdateTemplateNode(
  id: string,
  payload: UpdateTemplateNodePayload
): Promise<ApiResponse<WorkflowTemplateNode | null>> {
  const body: Record<string, unknown> = {}
  if (payload.key !== undefined) body.key = payload.key
  if (payload.name !== undefined) body.name = payload.name
  if (payload.description !== undefined) body.description = payload.description
  if (payload.executionType !== undefined) body.executionType = payload.executionType
  if (payload.intentType !== undefined) body.intentType = payload.intentType
  if (payload.orderIndex !== undefined) body.orderIndex = payload.orderIndex
  if (payload.dependsOnNodeIds !== undefined) body.dependsOnNodeIds = payload.dependsOnNodeIds
  if (payload.recommendedAgentTemplateId !== undefined)
    body.recommendedAgentTemplateId = payload.recommendedAgentTemplateId
  if (payload.allowedSkillIds !== undefined) body.allowedSkillIds = payload.allowedSkillIds
  return request<WorkflowTemplateNode | null>(`/api/workflow-template-nodes/${id}`, {
    method: 'PUT',
    body: Object.keys(body).length ? body : payload,
  })
}

export async function fetchCreateTemplateNode(
  templateId: string,
  payload: Partial<WorkflowTemplateNode>
): Promise<ApiResponse<WorkflowTemplateNode>> {
  const body = {
    key: payload.key ?? payload.nodeKey ?? '',
    name: payload.name ?? payload.nodeName ?? '',
    description: payload.description,
    executionType: payload.executionType,
    intentType: payload.intentType,
    orderIndex: payload.orderIndex,
    dependsOnNodeIds: payload.dependsOnNodeIds,
    recommendedAgentTemplateId: payload.recommendedAgentTemplateId,
    allowedSkillIds: payload.allowedSkillIds,
  }
  return request<WorkflowTemplateNode>(`/api/workflow-templates/${templateId}/nodes`, {
    method: 'POST',
    body,
  })
}

export async function fetchDeleteTemplateNode(id: string): Promise<ApiResponse<boolean>> {
  return request<boolean>(`/api/workflow-template-nodes/${id}`, { method: 'DELETE' })
}

export async function fetchReorderTemplateNodes(
  templateId: string,
  orderedNodeIds: string[]
): Promise<ApiResponse<WorkflowTemplateNode[]>> {
  return request<WorkflowTemplateNode[]>(`/api/workflow-templates/${templateId}/nodes/reorder`, {
    method: 'POST',
    body: { orderedNodeIds },
  })
}
