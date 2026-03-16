/**
 * 平台终端能力注册表 Schema（只读展示 + 启用/停用）
 * 替代终端类型工厂，能力由平台内置或申请接入，不可随意创建/删除
 */
export type CapabilityProtocol =
  | 'oauth2'
  | 'api_key'
  | 'webhook'
  | 'browser_automation'
  | 'mcp'

export type PlatformCapabilityStatus = 'active' | 'beta' | 'disabled' | 'coming_soon'

export interface CapabilityConfigField {
  key: string
  label: string
  type: 'string' | 'boolean' | 'select' | 'oauth_token' | 'textarea'
  required: boolean
  description?: string
  options?: { value: string; label: string }[]
}

export interface PlatformCapability {
  id: string
  code: string
  name: string
  nameZh: string
  description: string
  protocolType: CapabilityProtocol
  authType: 'oauth2' | 'api_key' | 'none'
  supportedProjectTypeIds: string[]
  supportedExecutionTypes: string[]
  supportedIntentTypes: string[]
  configFields: CapabilityConfigField[]
  status: PlatformCapabilityStatus
  isBuiltIn: boolean
  iconUrl?: string
  documentUrl?: string
  connectedTerminalCount?: number
  createdAt: string
  updatedAt: string
}

export interface PlatformCapabilityListParams {
  status?: PlatformCapabilityStatus
  protocolType?: CapabilityProtocol
}

export interface PlatformCapabilityUpdatePayload {
  status?: PlatformCapabilityStatus
}

export interface ListResult<T> {
  items: T[]
  total: number
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  meta?: { requestId?: string; timestamp?: string }
}
