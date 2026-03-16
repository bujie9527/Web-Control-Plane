/**
 * 租户成员 Mock，用于项目创建向导「负责人」选择
 */
import { MOCK_USERS } from '@/core/auth/mockUsers'

export interface TenantMemberItem {
  id: string
  name: string
}

export function getMembersByTenantId(tenantId: string): TenantMemberItem[] {
  return MOCK_USERS.filter((u) => u.tenant?.tenantId === tenantId).map((u) => ({
    id: u.id,
    name: u.name,
  }))
}
