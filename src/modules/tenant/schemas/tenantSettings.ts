/**
 * 租户系统管理：成员、角色、审计日志类型
 */
export interface TenantMemberItem {
  id: string
  name: string
  role: string
  status: string
}

export interface TenantRoleItem {
  id: string
  name: string
  permissionCount: number
}

export interface TenantAuditLogItem {
  id: string
  action: string
  operator: string
  result: string
  time: string
}
