import type { User } from '@/core/types/auth'

/** 具备 system admin 权限的角色 */
const SYSTEM_ADMIN_ROLES = ['platform_admin', 'platform_owner'] as const

export function isSystemAdmin(user: User | null): boolean {
  if (!user) return false
  return SYSTEM_ADMIN_ROLES.includes(user.role as (typeof SYSTEM_ADMIN_ROLES)[number])
}
