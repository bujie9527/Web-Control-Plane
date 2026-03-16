/**
 * 权限定义，与 04-core-domain-model 一致
 */
export interface Permission {
  id: string
  scope: string
  module: string
  action: string
  name?: string
}
