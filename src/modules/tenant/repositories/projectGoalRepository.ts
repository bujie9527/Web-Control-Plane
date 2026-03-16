import type { ApiResponse } from '@/core/types/api'
import type { ProjectGoal } from '../schemas/projectDomain'
import { parseResponseJson } from '@/core/api/safeParseResponse'

const API_BASE = typeof window !== 'undefined' ? '' : 'http://localhost:3001'

async function request<T>(
  url: string,
  options?: { method?: string; body?: unknown }
): Promise<ApiResponse<T>> {
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
      meta: json.meta as ApiResponse<T>['meta'],
    }
  }
  throw new Error(json.message || `HTTP ${res.status}`)
}

export async function fetchGoalsByProjectId(projectId: string): Promise<ApiResponse<ProjectGoal[]>> {
  return request<ProjectGoal[]>(`/api/projects/${projectId}/goals`)
}

export async function fetchCreateGoal(
  projectId: string,
  payload: {
    goalType?: string
    goalTypeCode?: string
    goalName: string
    goalDescription: string
    successCriteria?: string
    kpiDefinition?: string
    primaryMetricCode?: string
    secondaryMetricCodes?: string[]
  }
): Promise<ApiResponse<ProjectGoal>> {
  const goalType = payload.goalType ?? (payload.goalTypeCode ? mapGoalTypeCodeToType(payload.goalTypeCode) : 'other')
  return request<ProjectGoal>(`/api/projects/${projectId}/goals`, {
    method: 'POST',
    body: { ...payload, goalType },
  })
}

function mapGoalTypeCodeToType(code: string): string {
  const m: Record<string, string> = {
    ACCOUNT_FOLLOWERS: 'growth',
    ACCOUNT_ENGAGEMENT: 'growth',
    ACCOUNT_VIEWS: 'growth',
    PRIVATE_CONTACTS: 'conversion',
    DM_INQUIRIES: 'conversion',
    FORM_LEADS: 'conversion',
  }
  return m[code] ?? 'other'
}
