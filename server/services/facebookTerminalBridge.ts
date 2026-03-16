/**
 * Facebook 公共主页授权与 Terminal 实例桥接
 * OAuth 授权后：保存 Page Token 到 facebookCredentialStore，并创建/更新 Terminal 实例（type=facebook_page）
 */
import {
  dbListTerminals,
  dbCreateTerminal,
  dbUpdateTerminal,
  dbGetTerminalById,
} from '../domain/identityTerminalDb'
import {
  saveFacebookPageCredential,
  getFacebookPageAccessToken,
  getFacebookPageSummaryByPageId,
  revokeFacebookPageCredential,
} from '../data/facebookCredentialStore'

const FACEBOOK_PAGE_TERMINAL_TYPE = 'facebook_page'
const FACEBOOK_PAGE_TYPE_CATEGORY = 'api'

export interface AuthorizeAndUpsertResult {
  created: Array<{ id: string; name: string; pageId: string }>
  updated: Array<{ id: string; name: string; pageId: string }>
}

function parseCredentialsPageId(credentialsJson: string | undefined): string | null {
  if (!credentialsJson?.trim()) return null
  try {
    const o = JSON.parse(credentialsJson) as { pageId?: string }
    return typeof o.pageId === 'string' ? o.pageId : null
  } catch {
    return null
  }
}

/**
 * 使用 userAccessToken 拉取用户的主页列表，保存凭证并为每个主页创建或更新 Terminal 实例
 */
export async function authorizeAndUpsertTerminals(
  tenantId: string,
  userAccessToken: string
): Promise<AuthorizeAndUpsertResult> {
  const accountsRes = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,category&access_token=${encodeURIComponent(userAccessToken)}`
  )
  const accountsData = (await accountsRes.json()) as {
    data?: Array<{ id: string; name: string; access_token?: string; category?: string }>
    error?: { message: string }
  }
  if (accountsData.error || !Array.isArray(accountsData.data)) {
    throw new Error(accountsData.error?.message || '获取主页列表失败')
  }

  const created: AuthorizeAndUpsertResult['created'] = []
  const updated: AuthorizeAndUpsertResult['updated'] = []

  const existingList = await dbListTerminals({
    tenantId,
    type: FACEBOOK_PAGE_TERMINAL_TYPE,
    pageSize: 500,
  })
  const byPageId = new Map<string, (typeof existingList.items)[0]>()
  for (const t of existingList.items) {
    const pageId = parseCredentialsPageId(t.credentialsJson)
    if (pageId) byPageId.set(pageId, t)
  }

  for (const page of accountsData.data) {
    if (!page.access_token) continue
    const saved = saveFacebookPageCredential({
      pageId: page.id,
      pageName: page.name,
      pageCategory: page.category,
      accessToken: page.access_token,
    })
    const credentialsJson = JSON.stringify({
      pageId: page.id,
      tokenMasked: saved.tokenMasked,
    })
    const configJson = JSON.stringify({
      pageCategory: page.category,
      authorizedAt: saved.authorizedAt,
      expiresAt: saved.expiresAt ?? undefined,
    })
    const existing = byPageId.get(page.id)
    if (existing) {
      await dbUpdateTerminal(existing.id, {
        name: page.name,
        credentialsJson,
        configJson,
        status: 'active',
      })
      updated.push({ id: existing.id, name: page.name, pageId: page.id })
    } else {
      const term = await dbCreateTerminal({
        tenantId,
        name: page.name,
        type: FACEBOOK_PAGE_TERMINAL_TYPE,
        typeCategory: FACEBOOK_PAGE_TYPE_CATEGORY,
        status: 'active',
        credentialsJson,
        configJson,
      })
      created.push({ id: term.id, name: page.name, pageId: page.id })
    }
  }
  return { created, updated }
}

/**
 * 根据 terminalId 获取解密后的 Page Access Token（仅服务端内部使用）
 */
export async function getPageAccessTokenByTerminalId(terminalId: string): Promise<string | null> {
  const terminal = await dbGetTerminalById(terminalId)
  if (!terminal || terminal.type !== FACEBOOK_PAGE_TERMINAL_TYPE) return null
  const pageId = parseCredentialsPageId(terminal.credentialsJson)
  if (!pageId) return null
  return getFacebookPageAccessToken(pageId)
}

/**
 * 刷新 Terminal 对应的 Facebook 主页 Token
 * Page Access Token 长期有效，此处仅校验有效性；若已过期则返回错误提示重新授权
 */
export async function refreshTerminalPageToken(terminalId: string): Promise<{
  success: boolean
  message: string
}> {
  const terminal = await dbGetTerminalById(terminalId)
  if (!terminal || terminal.type !== FACEBOOK_PAGE_TERMINAL_TYPE) {
    return { success: false, message: '终端不存在或不是 Facebook 主页类型' }
  }
  const pageId = parseCredentialsPageId(terminal.credentialsJson)
  if (!pageId) return { success: false, message: '无法解析主页 ID' }
  const summary = getFacebookPageSummaryByPageId(pageId)
  if (!summary || summary.status !== 'active') {
    return { success: false, message: '该主页未授权或已撤销，请重新授权' }
  }
  const token = getFacebookPageAccessToken(pageId)
  if (!token) return { success: false, message: '无法获取访问凭证，请重新授权' }
  try {
    const debugRes = await fetch(
      `https://graph.facebook.com/v21.0/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(token)}`
    )
    const debugData = (await debugRes.json()) as { data?: { valid?: boolean } }
    if (debugData.data?.valid) {
      return { success: true, message: 'Token 有效' }
    }
    return { success: false, message: 'Token 已过期或无效，请在终端详情中重新授权' }
  } catch {
    return { success: false, message: '校验失败，请稍后重试或重新授权' }
  }
}

/**
 * 删除 Terminal 时同步撤销 Facebook 凭证
 */
export async function revokeFacebookCredentialByTerminalId(terminalId: string): Promise<boolean> {
  const terminal = await dbGetTerminalById(terminalId)
  if (!terminal || terminal.type !== FACEBOOK_PAGE_TERMINAL_TYPE) return false
  const pageId = parseCredentialsPageId(terminal.credentialsJson)
  if (!pageId) return false
  return revokeFacebookPageCredential(pageId)
}
