/**
 * 系统参考配置 Repository — 项目类型 / 目标类型 / 指标选项
 * 对应 /api/config/* 静态配置接口
 *
 * 替换原 projectTypeMock / goalTypeMock / goalMetricOptionMock
 */
import type { ApiResponse } from '@/core/types/api'
import { parseResponseJson } from '@/core/api/safeParseResponse'

const API_BASE = typeof window !== 'undefined' ? '' : 'http://localhost:3001'

async function request<T>(url: string): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${url}`, { headers: { 'Content-Type': 'application/json' } })
  const json = await parseResponseJson<{ code: number; message: string; data: T; meta?: unknown }>(res)
  if (res.ok && json.code === 0) return { code: 0, message: json.message, data: json.data, meta: json.meta as ApiResponse<T>['meta'] }
  throw new Error(json.message || `HTTP ${res.status}`)
}

// ─── 项目类型 ─────────────────────────────────────────────────────────────────

export interface ProjectTypeConfig {
  id: string
  code: string
  name: string
  description: string
  allowedGoalTypeCodes: string[]
  allowedDeliverableModes: string[]
  icon?: string
}

/** 获取所有项目类型 */
export async function fetchProjectTypes(): Promise<ApiResponse<ProjectTypeConfig[]>> {
  const res = await request<ProjectTypeConfig[]>('/api/config/project-types')
  return res
}

// ─── 目标类型 ─────────────────────────────────────────────────────────────────

export interface GoalTypeConfig {
  id: string
  code: string
  name: string
  allowedMetricCodes: string[]
}

/** 获取所有目标类型 */
export async function fetchGoalTypes(): Promise<ApiResponse<GoalTypeConfig[]>> {
  return request<GoalTypeConfig[]>('/api/config/goal-types')
}

/** 获取指定项目类型允许的目标类型 */
export async function fetchGoalTypesByProjectTypeCode(
  projectTypeCode: string
): Promise<ApiResponse<GoalTypeConfig[]>> {
  const [allGoals, allTypes] = await Promise.all([
    fetchGoalTypes(),
    fetchProjectTypes(),
  ])
  const projectType = allTypes.data.find((p) => p.code === projectTypeCode)
  const allowed = projectType?.allowedGoalTypeCodes ?? []
  const data = allGoals.data.filter((g) => allowed.includes(g.code))
  return { ...allGoals, data }
}

// ─── 指标选项 ─────────────────────────────────────────────────────────────────

export interface GoalMetricOptionConfig {
  code: string
  name: string
  unit: string
  goalTypeCodes: string[]
}

/** 获取所有指标选项 */
export async function fetchGoalMetricOptions(): Promise<ApiResponse<GoalMetricOptionConfig[]>> {
  return request<GoalMetricOptionConfig[]>('/api/config/goal-metric-options')
}

/** 获取指定目标类型的指标选项 */
export async function fetchMetricOptionsByGoalTypeCode(
  goalTypeCode: string
): Promise<ApiResponse<GoalMetricOptionConfig[]>> {
  const all = await fetchGoalMetricOptions()
  const data = all.data.filter((m) => m.goalTypeCodes.includes(goalTypeCode))
  return { ...all, data }
}
