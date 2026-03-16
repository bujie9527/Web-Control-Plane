/**
 * Terminal 类型（与 API / Prisma 一致）
 */
export type TerminalStatus = 'active' | 'inactive' | 'error' | 'testing'

export type TerminalTestResult = 'success' | 'failed' | 'unknown'

export interface Terminal {
  id: string
  tenantId: string
  name: string
  type: string
  typeCategory?: 'api' | 'browser' | 'mcp'
  status: string
  /** 绑定的身份 ID */
  identityId?: string
  /** 预留：该终端绑定的主身份 ID（与 identityId 同义，兼容旧代码） */
  primaryIdentityId?: string
  credentialsJson?: string
  configJson?: string
  /** OAuth 类型终端关联的外部资源 ID（如 Facebook pageId） */
  oauthPageId?: string
  /** Token 到期时间（ISO 字符串），用于 UI 提示 */
  tokenExpiresAt?: string
  /** 认证方式：oauth_facebook 为 Facebook 主页 OAuth，manual 为手填凭证 */
  authType?: 'oauth_facebook' | 'manual'
  linkedProjectIds?: string[]
  lastTestedAt?: string
  lastTestResult?: TerminalTestResult
  lastTestMessage?: string
  notes?: string
  capabilities?: string[]
  riskStatus?: string
  createdAt: string
  updatedAt: string
}

/** 终端操作日志项（用于最近操作列表展示） */
export interface TerminalLogItem {
  id: string
  action: string
  terminal: string
  result?: string
  time?: string
}
