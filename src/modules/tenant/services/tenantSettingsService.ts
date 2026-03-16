/**
 * 租户系统管理服务：成员、角色、审计日志
 * 当前阶段成员与审计日志返回空数组，待 User model 建立后接入真实 API
 */
import type {
  TenantMemberItem,
  TenantRoleItem,
  TenantAuditLogItem,
} from '../schemas/tenantSettings'

export type { TenantMemberItem, TenantRoleItem, TenantAuditLogItem }

/** 内置角色（占位，待 RBAC 完善后由后端提供） */
const BUILTIN_ROLES: TenantRoleItem[] = [
  { id: 'r1', name: '管理员', permissionCount: 12 },
  { id: 'r2', name: '成员', permissionCount: 6 },
]

export async function getTenantMembers(_tenantId: string): Promise<TenantMemberItem[]> {
  return []
}

export async function getTenantRoles(_tenantId: string): Promise<TenantRoleItem[]> {
  return BUILTIN_ROLES.slice()
}

export async function getTenantAuditLogs(
  _tenantId: string,
  _limit = 50
): Promise<TenantAuditLogItem[]> {
  return []
}
