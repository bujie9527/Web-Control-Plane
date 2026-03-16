/**
 * 流程模板发布记录 Repository — 对应 /api/workflow-templates/:id/publish-records
 */
import type { ApiResponse } from '@/core/types/api'
import type { WorkflowPublishRecord, CreateWorkflowPublishRecordPayload } from '../schemas/workflowPublishRecord'
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

/** 获取模板的发布记录列表（降序） */
export async function fetchPublishRecords(
  templateId: string
): Promise<ApiResponse<WorkflowPublishRecord[]>> {
  return request<WorkflowPublishRecord[]>(
    `/api/workflow-templates/${templateId}/publish-records`
  )
}

/** 创建发布记录 */
export async function createPublishRecord(
  templateId: string,
  payload: Omit<CreateWorkflowPublishRecordPayload, 'templateId'>
): Promise<ApiResponse<WorkflowPublishRecord>> {
  return request<WorkflowPublishRecord>(
    `/api/workflow-templates/${templateId}/publish-records`,
    { method: 'POST', body: payload }
  )
}
