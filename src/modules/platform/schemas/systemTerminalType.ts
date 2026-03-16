/**
 * 终端类型工厂 Schema（与 server/domain/systemTerminalTypeDb 一致）
 */
export type SystemTerminalTypeCategory = 'api' | 'browser' | 'mcp'
export type SystemTerminalTypeStatus = 'active' | 'disabled'

export interface SystemTerminalType {
  id: string
  name: string
  nameZh: string
  code: string
  typeCategory: SystemTerminalTypeCategory
  icon?: string
  description?: string
  /** 认证方式：oauth_facebook 驱动前端展示 OAuth 授权，manual 为手填凭证 */
  authType?: 'oauth' | 'manual' | 'oauth_facebook'
  authSchema?: string
  configSchema?: string
  supportedProjectTypeIds?: string[]
  capabilityTags?: string[]
  status: SystemTerminalTypeStatus
  isSystemPreset: boolean
  version: string
  createdAt: string
  updatedAt: string
  /** 列表接口返回：该类型已被多少终端实例使用 */
  instanceCount?: number
}

export interface SystemTerminalTypeListParams {
  page?: number
  pageSize?: number
  keyword?: string
  typeCategory?: SystemTerminalTypeCategory | ''
  status?: SystemTerminalTypeStatus | ''
}

export interface SystemTerminalTypeUsage {
  instanceCount: number
  instances: { id: string; tenantId: string; name: string; status: string; createdAt: string }[]
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  meta?: { pagination?: { page: number; pageSize: number; total: number } }
}

export interface ListResult<T> {
  items: T[]
  total: number
}
