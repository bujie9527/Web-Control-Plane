/**
 * Facebook 主页凭证 Mock（前端用摘要列表，真实 token 仅服务端）
 */
import type { FacebookPageCredentialSummary } from '../schemas/facebookPageCredential'

const now = new Date().toISOString()

const _summaries: FacebookPageCredentialSummary[] = [
  {
    id: 'fpc-1',
    pageId: '123456789',
    pageName: '演示主页 A',
    pageCategory: '品牌',
    tokenMasked: 'EAAG****...****xyz',
    status: 'active',
    authorizedAt: '2025-03-01T10:00:00Z',
    expiresAt: '2026-03-01T10:00:00Z',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'fpc-2',
    pageId: '987654321',
    pageName: '演示主页 B',
    pageCategory: '自媒体',
    tokenMasked: 'EAAG****...****abc',
    status: 'active',
    authorizedAt: '2025-03-10T12:00:00Z',
    createdAt: now,
    updatedAt: now,
  },
]

export function listFacebookPageCredentialSummaries(): FacebookPageCredentialSummary[] {
  return [..._summaries]
}

export function getFacebookPageCredentialSummaryById(id: string): FacebookPageCredentialSummary | null {
  return _summaries.find((s) => s.id === id) ?? null
}

export function getFacebookPageCredentialSummaryByPageId(pageId: string): FacebookPageCredentialSummary | null {
  return _summaries.find((s) => s.pageId === pageId) ?? null
}

/** 撤销后从列表中移除（mock：仅改状态，实际由服务端 revoke 接口处理） */
export function revokeFacebookPageCredential(pageId: string): boolean {
  const i = _summaries.findIndex((s) => s.pageId === pageId)
  if (i < 0) return false
  _summaries[i] = { ..._summaries[i], status: 'revoked', updatedAt: new Date().toISOString() }
  return true
}
