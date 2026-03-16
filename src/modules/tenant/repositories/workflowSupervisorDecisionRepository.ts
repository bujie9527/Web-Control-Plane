/**
 * 流程监督决策 Repository — 对应 /api/workflow-instances/:id/supervisor-decisions
 */
import type { ApiResponse } from '@/core/types/api'
import type {
  SupervisorDecisionApi,
  CreateSupervisorDecisionPayload,
  SupervisorDecisionStatus,
} from '../schemas/workflowRuntime'
import type { WorkflowSupervisorDecision } from '../schemas/workflowExecution'
import { mapApiDecisionToExecution } from '../services/workflowSupervisorDecisionShared'
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

/** 获取实例所有监督决策（降序），返回执行层类型 */
export async function fetchSupervisorDecisions(
  instanceId: string
): Promise<ApiResponse<WorkflowSupervisorDecision[]>> {
  const res = await request<SupervisorDecisionApi[]>(
    `/api/workflow-instances/${instanceId}/supervisor-decisions`
  )
  if (res.code !== 0 || !res.data) return res as unknown as ApiResponse<WorkflowSupervisorDecision[]>
  return { ...res, data: res.data.map(mapApiDecisionToExecution) }
}

/** 按 ID 获取单条监督决策 */
export async function fetchSupervisorDecisionById(
  decisionId: string
): Promise<ApiResponse<WorkflowSupervisorDecision | null>> {
  const res = await request<SupervisorDecisionApi | null>(`/api/supervisor-decisions/${decisionId}`)
  if (res.code !== 0 || !res.data) return res as unknown as ApiResponse<WorkflowSupervisorDecision | null>
  return { ...res, data: mapApiDecisionToExecution(res.data) }
}

/** 创建监督决策（API 返回 API 形状，调用方需映射） */
export async function createSupervisorDecision(
  instanceId: string,
  payload: Omit<CreateSupervisorDecisionPayload, 'instanceId'>
): Promise<ApiResponse<WorkflowSupervisorDecision>> {
  const res = await request<SupervisorDecisionApi>(
    `/api/workflow-instances/${instanceId}/supervisor-decisions`,
    { method: 'POST', body: payload }
  )
  if (res.code !== 0 || !res.data) return res as unknown as ApiResponse<WorkflowSupervisorDecision>
  return { ...res, data: mapApiDecisionToExecution(res.data) }
}

/** 更新决策状态（应用 / 忽略） */
export async function updateDecisionStatus(
  decisionId: string,
  status: SupervisorDecisionStatus,
  appliedBy?: string
): Promise<ApiResponse<WorkflowSupervisorDecision>> {
  const res = await request<SupervisorDecisionApi>(
    `/api/supervisor-decisions/${decisionId}/status`,
    { method: 'PATCH', body: { status, appliedBy } }
  )
  if (res.code !== 0 || !res.data) return res as unknown as ApiResponse<WorkflowSupervisorDecision>
  return { ...res, data: mapApiDecisionToExecution(res.data) }
}
