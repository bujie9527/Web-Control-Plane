/**
 * 流程运行日志 Repository — 对应 /api/workflow-instances/:id/runtime-logs
 */
import type { ApiResponse } from '@/core/types/api'
import type { WorkflowRuntimeLog, AppendRuntimeLogPayload } from '../schemas/workflowRuntime'
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

/** 获取实例所有运行日志（升序） */
export async function fetchRuntimeLogs(
  instanceId: string
): Promise<ApiResponse<WorkflowRuntimeLog[]>> {
  return request<WorkflowRuntimeLog[]>(`/api/workflow-instances/${instanceId}/runtime-logs`)
}

/** 写入一条运行日志 */
export async function appendRuntimeLog(
  instanceId: string,
  payload: Omit<AppendRuntimeLogPayload, 'instanceId'>
): Promise<ApiResponse<WorkflowRuntimeLog>> {
  return request<WorkflowRuntimeLog>(`/api/workflow-instances/${instanceId}/runtime-logs`, {
    method: 'POST',
    body: payload,
  })
}
