/**
 * 租户系统管理 Mock：成员、角色、审计日志
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

const _members: TenantMemberItem[] = [
  { id: 'm1', name: '张三', role: '管理员', status: '正常' },
  { id: 'm2', name: '李四', role: '成员', status: '正常' },
]

const _roles: TenantRoleItem[] = [
  { id: 'r1', name: '管理员', permissionCount: 12 },
  { id: 'r2', name: '成员', permissionCount: 6 },
]

const _auditLogs: TenantAuditLogItem[] = [
  { id: 'al1', action: '登录', operator: '张三', result: '成功', time: '2025-03-08 09:00' },
  { id: 'al2', action: '修改项目配置', operator: '李四', result: '成功', time: '2025-03-08 08:30' },
  { id: 'al3', action: '创建项目', operator: '张三', result: '成功', time: '2025-03-08 08:00' },
]

export function getTenantMembers(_tenantId: string): TenantMemberItem[] {
  return _members.slice()
}

export function getTenantRoles(_tenantId: string): TenantRoleItem[] {
  return _roles.slice()
}

export function getTenantAuditLogs(_tenantId: string, limit = 50): TenantAuditLogItem[] {
  return _auditLogs.slice(0, limit)
}
