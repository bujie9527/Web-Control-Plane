import type { ApiResponse } from '@/core/types/api'
import type { WorkflowInstanceNode } from '../schemas/workflowExecution'
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

export async function fetchNodesByInstanceId(
  workflowInstanceId: string
): Promise<ApiResponse<WorkflowInstanceNode[]>> {
  return request<WorkflowInstanceNode[]>(
    `/api/workflow-instances/${workflowInstanceId}/nodes`
  )
}

/** Phase C：Worker 写入扩展字段，后端 PUT 需支持 */
export interface UpdateInstanceNodePayload {
  status?: string
  resultSummary?: string
  workerOutputJson?: Record<string, unknown>
  errorSummary?: string
  reviewSummary?: string
  retryCount?: number
  workerExecutionModel?: string
  workerExecutionDurationMs?: number
  workerExecutionAgentId?: string
  selectedAgentTemplateId?: string
  recoveryStatus?: string
  lastRecoveryAction?: string
}

export async function updateNode(
  nodeId: string,
  payload: UpdateInstanceNodePayload
): Promise<ApiResponse<WorkflowInstanceNode | null>> {
  return request<WorkflowInstanceNode | null>(`/api/workflow-instance-nodes/${nodeId}`, {
    method: 'PUT',
    body: payload,
  })
}
