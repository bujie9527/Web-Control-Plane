/**
 * 统计聚合 Repository — 对应 /api/stats/* 接口
 * 替换原 tenantDashboardMock / taskCenterMock / platformDashboardMock
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

// ─── 租户工作台统计 ───────────────────────────────────────────────────────────

export interface TenantDashboardStats {
  projectCount: number
  taskCount: number
  instanceCount: number
  identityCount: number
  terminalCount: number
}

export async function fetchTenantDashboardStats(
  tenantId: string
): Promise<ApiResponse<TenantDashboardStats>> {
  return request<TenantDashboardStats>(
    `/api/stats/tenant-dashboard?tenantId=${encodeURIComponent(tenantId)}`
  )
}

// ─── 任务中心汇总 ─────────────────────────────────────────────────────────────

export interface TaskCenterStats {
  total: number
  pending: number
  running: number
  completed: number
  failed: number
}

export async function fetchTaskCenterStats(
  tenantId: string
): Promise<ApiResponse<TaskCenterStats>> {
  return request<TaskCenterStats>(
    `/api/stats/task-center?tenantId=${encodeURIComponent(tenantId)}`
  )
}

/** 任务中心完整数据（含汇总与列表；列表待后端扩展后填充） */
export interface TaskCenterData {
  summary: { total: number; running: number; review: number; failed: number; done: number }
  runningTasks: Array<{ id: string; taskName: string; status: string; updatedAt: string; projectName?: string; identityName?: string }>
  reviewTasks: Array<{ id: string; taskName: string; status: string; updatedAt: string; projectName?: string; identityName?: string }>
  failedTasks: Array<{ id: string; taskName: string; status: string; updatedAt: string; projectName?: string; identityName?: string }>
  doneTasks: Array<{ id: string; taskName: string; status: string; updatedAt: string; projectName?: string; identityName?: string }>
}

export async function fetchTaskCenterData(
  tenantId: string
): Promise<ApiResponse<TaskCenterData>> {
  const res = await fetchTaskCenterStats(tenantId)
  if (res.code !== 0) return { ...res, data: null as unknown as TaskCenterData }
  const s = res.data
  const data: TaskCenterData = {
    summary: {
      total: s.total,
      running: s.running,
      review: 0,
      failed: s.failed,
      done: s.completed,
    },
    runningTasks: [],
    reviewTasks: [],
    failedTasks: [],
    doneTasks: [],
  }
  return { ...res, data }
}

// ─── 平台工作台统计 ───────────────────────────────────────────────────────────

export interface PlatformDashboardStats {
  tenantCount: number
  projectCount: number
  agentCount: number
  skillCount: number
}

export async function fetchPlatformDashboardStats(): Promise<ApiResponse<PlatformDashboardStats>> {
  return request<PlatformDashboardStats>('/api/stats/platform-dashboard')
}
