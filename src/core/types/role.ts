/**
 * 角色类型，与 04-core-domain-model 一致
 */
export interface Role {
  id: string
  name: string
  code: string
  scope?: string
  permissionIds?: string[]
  createdAt?: string
  updatedAt?: string
}
