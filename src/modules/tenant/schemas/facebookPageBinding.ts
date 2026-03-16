/**
 * 项目与 Facebook 主页的绑定关系
 * 每个绑定 = 一个 Facebook Page + 一个 Identity + 关联的 Credential
 */

/** 绑定状态 */
export type FacebookPageBindingStatus = 'active' | 'inactive' | 'revoked'

export interface FacebookPageBinding {
  id: string
  projectId: string
  pageId: string
  pageName: string
  credentialId: string
  identityId: string
  status: FacebookPageBindingStatus
  createdAt: string
  updatedAt: string
}
