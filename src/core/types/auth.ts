/**
 * 身份与权限相关类型，预留 scope 扩展
 */
export type ConsoleType = 'platform' | 'tenant'

export type RoleCode =
  | 'platform_owner'
  | 'platform_admin'
  | 'platform_operator'
  | 'tenant_owner'
  | 'tenant_admin'
  | 'project_manager'
  | 'operator'
  | 'reviewer'
  | 'viewer'

/** 预留：细粒度权限 scope，后续扩展 */
export type PermissionScope = string

export interface TenantContext {
  tenantId: string
  tenantName: string
}

export interface User {
  id: string
  name: string
  account: string
  role: RoleCode
  /** 租户后台时必填 */
  tenant?: TenantContext
}

export interface AuthState {
  user: User | null
  consoleType: ConsoleType
  /** 预留 scope，后续做细粒度控制 */
  scopes?: PermissionScope[]
}
