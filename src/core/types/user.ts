/**
 * 用户类型，与 04-core-domain-model 一致，平台/租户共用
 */
export type UserStatus = 'active' | 'inactive'

export interface User {
  id: string
  name: string
  email?: string
  account?: string
  status: UserStatus
  tenantId?: string
  roles?: string[]
  createdAt: string
  updatedAt: string
}
