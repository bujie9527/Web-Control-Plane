import type { ApiResponse, ListResult } from '@/core/types/api'

/**
 * Identity 状态，与标准资源一致
 */
export type IdentityStatus = 'draft' | 'active' | 'archived'

/**
 * Identity 类型：品牌官号 / KOC / 专家 / 助手 等
 */
export type IdentityType = 'brand_official' | 'koc' | 'expert' | 'assistant' | 'other'

/**
 * Identity 标准对象（07-identity-persona-model）
 * 用于定义账号是谁、立场、风格、内容与行为边界、平台适配
 */
export interface Identity {
  id: string
  tenantId: string
  name: string
  type: IdentityType
  corePositioning: string
  toneStyle: string
  contentDirections: string
  behaviorRules: string
  /** 按平台差异化说明，如 { wechat: "...", x: "..." } */
  platformAdaptations: Record<string, string>
  status: IdentityStatus
  createdAt: string
  updatedAt: string
}

/** 列表展示：适用平台标签，如 "微信、X、抖音" */
export interface IdentityListItem extends Identity {
  platformLabels?: string
}

export interface IdentityListParams {
  tenantId: string
  page?: number
  pageSize?: number
  keyword?: string
  status?: IdentityStatus
  type?: IdentityType
}

export type { ApiResponse, ListResult }
