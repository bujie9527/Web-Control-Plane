/**
 * Facebook 公共主页授权凭证
 * 参照 LLMCredential 模式：access_token 存服务端，前台只展示 tokenMasked
 */

/** 凭证状态 */
export type FacebookPageCredentialStatus = 'active' | 'expired' | 'revoked'

/** 前端可见的凭证摘要（不包含真实 token） */
export interface FacebookPageCredentialSummary {
  id: string
  pageId: string
  pageName: string
  pageCategory?: string
  tokenMasked: string
  status: FacebookPageCredentialStatus
  authorizedAt: string
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

/** 服务端存储的完整凭证（含加密 token，仅服务端使用） */
export interface FacebookPageCredential extends FacebookPageCredentialSummary {
  /** 加密后的 Page Access Token（仅服务端存储与读取） */
  encryptedAccessToken: string
}
