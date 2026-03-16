import type { ApiResponse, ListResult } from '@/core/types/api'

/**
 * 租户相关类型，与 04-core-domain-model 一致，供平台后台使用
 */
export type TenantStatus = 'active' | 'suspended' | 'expired'

export interface Tenant {
  id: string
  name: string
  code: string
  status: TenantStatus
  plan: string
  memberCount: number
  projectCount: number
  quotaUsage?: string
  createdAt: string
  updatedAt: string
}

export interface TenantDetail extends Tenant {
  quotaDetail?: { key: string; value: string }[]
  recentMembers?: { id: string; name: string }[]
  recentProjects?: { id: string; name: string }[]
  recentAudit?: { id: string; action: string; result: string; createdAt: string }[]
}

export interface TenantListParams {
  page?: number
  pageSize?: number
  keyword?: string
  status?: TenantStatus
  plan?: string
}

export type { ApiResponse, ListResult }
