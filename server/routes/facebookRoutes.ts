import crypto from 'crypto'
import type { Express, NextFunction, Request, Response } from 'express'
import {
  getFacebookPageAccessToken,
  listFacebookPageSummaries,
  revokeFacebookPageCredential,
} from '../data/facebookCredentialStore'
import {
  DEFAULT_FACEBOOK_SCOPES,
  getFacebookIntegrationForClient,
  getFacebookIntegrationSecret,
  saveFacebookIntegration,
} from '../data/platformIntegrationStore'
import { authorizeAndUpsertTerminals } from '../services/facebookTerminalBridge'

function buildMeta() {
  return {
    requestId: '',
    timestamp: new Date().toISOString(),
  }
}

async function getIdentityTerminalDb() {
  try {
    return await import('../domain/identityTerminalDb')
  } catch {
    return null
  }
}

function getFacebookAppId(): string {
  const fromStore = getFacebookIntegrationForClient()
  if (fromStore?.appId) return fromStore.appId
  return process.env.FACEBOOK_APP_ID || ''
}

function getFacebookAppSecret(): string {
  const secret = getFacebookIntegrationSecret()
  if (secret) return secret
  return process.env.FACEBOOK_APP_SECRET || ''
}

function isLocalhostRedirect(uri: string): boolean {
  const u = (uri || '').trim().toLowerCase()
  return (
    u.startsWith('http://127.0.0.1') ||
    u.startsWith('http://localhost') ||
    u.startsWith('https://localhost')
  )
}

function getConfiguredFacebookRedirectUri(): string {
  const fromStore = getFacebookIntegrationForClient()
  const stored = (fromStore?.redirectUri || '').trim()
  if (stored && !isLocalhostRedirect(stored)) return stored
  return (process.env.FACEBOOK_REDIRECT_URI || '').trim()
}

function getRequestOrigin(req: Request): string {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '')
    .split(',')[0]
    .trim()
  const forwardedHost = String(req.headers['x-forwarded-host'] || '')
    .split(',')[0]
    .trim()
  const protocol = forwardedProto || req.protocol || 'http'
  const host = forwardedHost || req.get('host') || ''
  return host ? `${protocol}://${host}` : ''
}

function getFacebookRedirectUri(req?: Request): string {
  const configured = getConfiguredFacebookRedirectUri()
  if (configured && !isLocalhostRedirect(configured)) return configured
  const origin = req ? getRequestOrigin(req) : ''
  return origin ? `${origin}/api/facebook/auth/callback` : ''
}

function getFacebookFrontendRedirect(req?: Request): string {
  const configured = (process.env.FACEBOOK_FRONTEND_REDIRECT || '').trim()
  if (configured) return configured
  const origin = req ? getRequestOrigin(req) : ''
  return origin ? `${origin}/tenant/facebook-pages` : '/tenant/facebook-pages'
}

const FACEBOOK_PAGE_ID_REGEX = /^\d+$/

function isValidFacebookPageId(pageId: string): boolean {
  return FACEBOOK_PAGE_ID_REGEX.test(pageId.trim())
}

function getFacebookScopes(): string {
  const config = getFacebookIntegrationForClient()
  return (config?.scopes ?? '').trim() || DEFAULT_FACEBOOK_SCOPES
}

const facebookOAuthStateStore = new Map<string, { expiry: number; tenantId?: string }>()
const FACEBOOK_OAUTH_STATE_TTL_MS = 10 * 60 * 1000

function createFacebookOAuthState(tenantId?: string): string {
  const state = crypto.randomBytes(24).toString('hex')
  facebookOAuthStateStore.set(state, {
    expiry: Date.now() + FACEBOOK_OAUTH_STATE_TTL_MS,
    tenantId: tenantId?.trim() || undefined,
  })
  return state
}

function consumeFacebookOAuthState(state: string): { valid: boolean; tenantId?: string } {
  const entry = facebookOAuthStateStore.get(state)
  facebookOAuthStateStore.delete(state)
  if (entry == null || Date.now() > entry.expiry) return { valid: false }
  return { valid: true, tenantId: entry.tenantId }
}

function requireFacebookApiAuth(req: Request, res: Response, next: NextFunction) {
  const secret = process.env.API_SECRET || process.env.FACEBOOK_AUTH_SECRET
  if (!secret) {
    next()
    return
  }
  const authHeader = req.headers.authorization
  const token =
    typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (token !== secret) {
    res.status(401).json({
      code: 401,
      message: '未授权',
      data: null,
      meta: buildMeta(),
    })
    return
  }
  next()
}

export function registerFacebookRoutes(app: Express): void {
  app.get('/api/platform-integrations/facebook', (req, res) => {
    const config = getFacebookIntegrationForClient()
    const storedRedirect = (config?.redirectUri || '').trim()
    const redirectUri =
      storedRedirect && !isLocalhostRedirect(storedRedirect)
        ? storedRedirect
        : getFacebookRedirectUri(req)
    const data = config
      ? {
          ...config,
          redirectUri,
        }
      : null
    res.json({
      code: 0,
      message: 'success',
      data,
      meta: buildMeta(),
    })
  })

  app.get('/api/platform-integrations/facebook/stats', async (_req, res) => {
    try {
      const pages = listFacebookPageSummaries()
      const db = await getIdentityTerminalDb()
      let totalTerminals = 0
      if (db) {
        const result = await db.dbListTerminals({ type: 'facebook_page', pageSize: 1 })
        totalTerminals = result.total
      }
      res.json({
        code: 0,
        message: 'success',
        data: {
          totalAuthorizedPages: pages.length,
          totalFacebookTerminals: totalTerminals,
        },
        meta: buildMeta(),
      })
    } catch (e) {
      res.status(500).json({
        code: 500,
        message: e instanceof Error ? e.message : '获取统计失败',
        data: null,
        meta: buildMeta(),
      })
    }
  })

  app.put('/api/platform-integrations/facebook', (req, res) => {
    const body = req.body as {
      appId?: string
      appSecret?: string
      redirectUri?: string
      scopes?: string
      isEnabled?: boolean
    }
    const appId = typeof body?.appId === 'string' ? body.appId.trim() : ''
    const appSecret = typeof body?.appSecret === 'string' ? body.appSecret.trim() : undefined
    let redirectUri = typeof body?.redirectUri === 'string' ? body.redirectUri.trim() : undefined
    if (redirectUri && isLocalhostRedirect(redirectUri)) redirectUri = undefined
    const scopes = typeof body?.scopes === 'string' ? body.scopes.trim() : undefined
    const isEnabled = typeof body?.isEnabled === 'boolean' ? body.isEnabled : true
    if (!appId) {
      res.status(400).json({
        code: 400,
        message: 'App ID 不能为空',
        data: null,
        meta: buildMeta(),
      })
      return
    }
    try {
      const updated = saveFacebookIntegration({
        appId,
        appSecret,
        redirectUri,
        scopes,
        isEnabled,
      })
      res.json({
        code: 0,
        message: 'success',
        data: updated,
        meta: buildMeta(),
      })
    } catch (e) {
      res.status(500).json({
        code: 500,
        message: e instanceof Error ? e.message : '保存失败',
        data: null,
        meta: buildMeta(),
      })
    }
  })

  app.get('/api/facebook/config', (_req, res) => {
    const appId = getFacebookAppId()
    const scopes = getFacebookScopes()
    res.json({
      code: 0,
      message: 'success',
      data: appId ? { appId, scopes } : null,
      meta: buildMeta(),
    })
  })

  app.post('/api/facebook/auth/with-token', requireFacebookApiAuth, async (req, res) => {
    const body = req.body as { userAccessToken?: string; tenantId?: string }
    const userToken = typeof body?.userAccessToken === 'string' ? body.userAccessToken.trim() : ''
    const tenantId = typeof body?.tenantId === 'string' ? body.tenantId.trim() : ''
    if (!userToken) {
      res.status(400).json({
        code: 400,
        message: '请提供 userAccessToken',
        data: null,
        meta: buildMeta(),
      })
      return
    }
    if (!tenantId) {
      res.status(400).json({
        code: 400,
        message: '请提供 tenantId',
        data: null,
        meta: buildMeta(),
      })
      return
    }
    try {
      const result = await authorizeAndUpsertTerminals(tenantId, userToken)
      res.json({
        code: 0,
        message: 'success',
        data: {
          created: result.created,
          updated: result.updated,
          pageCount: result.created.length + result.updated.length,
        },
        meta: buildMeta(),
      })
    } catch (e) {
      const rawMsg = e instanceof Error ? e.message : '服务端异常'
      // eslint-disable-next-line no-console -- keep server diagnostics for auth flow
      console.error('[facebook auth with-token] error:', rawMsg)
      res.status(500).json({
        code: 500,
        message: rawMsg.includes('获取主页列表') ? rawMsg : '处理失败，请稍后重试',
        data: null,
        meta: buildMeta(),
      })
    }
  })

  app.post('/api/facebook/auth/init', requireFacebookApiAuth, (req, res) => {
    const appId = getFacebookAppId()
    if (!appId) {
      res.status(503).json({
        code: 503,
        message: 'Facebook 集成尚未配置，请在平台设置中完成认证配置',
        data: null,
        meta: buildMeta(),
      })
      return
    }
    const tenantId = (req.body as { tenantId?: string })?.tenantId as string | undefined
    const state = createFacebookOAuthState(tenantId?.trim())
    const redirectUri = getFacebookRedirectUri(req)
    if (!redirectUri) {
      res.status(503).json({
        code: 503,
        message: '未能确定 OAuth 回调地址，请配置 FACEBOOK_REDIRECT_URI',
        data: null,
        meta: buildMeta(),
      })
      return
    }
    const scopes = getFacebookScopes()
    const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=code&state=${encodeURIComponent(state)}`
    res.json({
      code: 0,
      message: 'success',
      data: { authUrl },
      meta: buildMeta(),
    })
  })

  app.get('/api/facebook/auth/callback', async (req, res) => {
    const frontendRedirect = getFacebookFrontendRedirect(req)
    const code = (req.query.code as string) || ''
    const state = (req.query.state as string) || ''
    const error = req.query.error as string | undefined
    if (error) {
      res.redirect(
        `${frontendRedirect}?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent((req.query.error_description as string) || '')}`
      )
      return
    }
    const stateResult = consumeFacebookOAuthState(state)
    if (!state || !stateResult.valid) {
      res.redirect(
        `${frontendRedirect}?error=invalid_state&error_description=state 无效或已过期，请重新发起授权`
      )
      return
    }
    const tenantId = stateResult.tenantId || ''
    const appId = getFacebookAppId()
    const appSecret = getFacebookAppSecret()
    const redirectUri = getFacebookRedirectUri(req)
    if (!code || !appId || !appSecret || !redirectUri) {
      res.redirect(
        `${frontendRedirect}?error=config&error_description=${encodeURIComponent('Facebook 集成尚未配置，请在平台设置中完成认证配置')}`
      )
      return
    }
    try {
      const tokenRes = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${encodeURIComponent(appSecret)}&code=${encodeURIComponent(code)}`
      )
      const tokenData = (await tokenRes.json()) as {
        access_token?: string
        error?: { message: string }
      }
      if (tokenData.error || !tokenData.access_token) {
        const rawMsg = tokenData.error?.message || '获取 access_token 失败'
        // eslint-disable-next-line no-console -- keep server diagnostics for callback flow
        console.error('[facebook auth callback] token error:', rawMsg)
        res.redirect(
          `${frontendRedirect}?error=token&error_description=${encodeURIComponent('获取访问凭证失败，请重试')}`
        )
        return
      }
      const userToken = tokenData.access_token
      if (tenantId) {
        await authorizeAndUpsertTerminals(tenantId, userToken)
      } else {
        const accountsRes = await fetch(
          `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,category&access_token=${encodeURIComponent(userToken)}`
        )
        const accountsData = (await accountsRes.json()) as {
          data?: Array<{ id: string; name: string; access_token?: string; category?: string }>
          error?: { message: string }
        }
        if (!accountsData.error && Array.isArray(accountsData.data)) {
          const { saveFacebookPageCredential: saveCred } = await import('../data/facebookCredentialStore')
          for (const page of accountsData.data) {
            if (page.access_token) {
              saveCred({
                pageId: page.id,
                pageName: page.name,
                pageCategory: page.category,
                accessToken: page.access_token,
              })
            }
          }
        }
      }
      res.redirect(
        `${frontendRedirect}?oauth_success=1${tenantId ? `&tenantId=${encodeURIComponent(tenantId)}` : ''}`
      )
    } catch (e) {
      const rawMsg = e instanceof Error ? e.message : '服务端异常'
      // eslint-disable-next-line no-console -- keep server diagnostics for callback flow
      console.error('[facebook auth callback] server error:', rawMsg)
      res.redirect(
        `${frontendRedirect}?error=server&error_description=${encodeURIComponent('服务端异常，请稍后重试')}`
      )
    }
  })

  app.get('/api/facebook/pages', requireFacebookApiAuth, (_req, res) => {
    const list = listFacebookPageSummaries()
    res.json({
      code: 0,
      message: 'success',
      data: list,
      meta: buildMeta(),
    })
  })

  app.delete('/api/facebook/pages/:pageId/revoke', requireFacebookApiAuth, (req, res) => {
    const pageId = String(req.params.pageId || '').trim()
    if (!pageId || !isValidFacebookPageId(pageId)) {
      res.status(400).json({
        code: 400,
        message: 'pageId 格式无效',
        data: null,
        meta: buildMeta(),
      })
      return
    }
    const ok = revokeFacebookPageCredential(pageId)
    res.json({
      code: 0,
      message: ok ? 'success' : '未找到该主页凭证',
      data: { revoked: ok },
      meta: buildMeta(),
    })
  })

  app.post('/api/facebook/pages/:pageId/posts', requireFacebookApiAuth, async (req, res) => {
    const pageId = String(req.params.pageId || '').trim()
    if (!pageId || !isValidFacebookPageId(pageId)) {
      res.status(400).json({
        code: 400,
        message: 'pageId 格式无效',
        data: null,
        meta: buildMeta(),
      })
      return
    }
    const token = getFacebookPageAccessToken(pageId)
    if (!token) {
      res.status(404).json({
        code: 404,
        message: '该主页未授权或已撤销',
        data: null,
        meta: buildMeta(),
      })
      return
    }
    const body = req.body as { message?: string; link?: string }
    const message = body.message?.trim()
    const link = body.link?.trim()
    if (!message && !link) {
      res.status(400).json({
        code: 400,
        message: '请提供 message 或 link',
        data: null,
        meta: buildMeta(),
      })
      return
    }
    try {
      const formBody = new URLSearchParams()
      if (message) formBody.set('message', message)
      if (link) formBody.set('link', link)
      formBody.set('access_token', token)
      const graphRes = await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(pageId)}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody.toString(),
      })
      const result = (await graphRes.json()) as { id?: string; error?: { message: string; code?: number } }
      if (result.error) {
        res.status(400).json({
          code: 400,
          message: result.error.message || '发帖失败',
          data: null,
          meta: buildMeta(),
        })
        return
      }
      res.json({
        code: 0,
        message: 'success',
        data: { postId: result.id },
        meta: buildMeta(),
      })
    } catch (e) {
      res.status(500).json({
        code: 500,
        message: e instanceof Error ? e.message : '发帖请求异常',
        data: null,
        meta: buildMeta(),
      })
    }
  })

  app.post('/api/facebook/pages/:pageId/posts/schedule', requireFacebookApiAuth, async (req, res) => {
    const pageId = String(req.params.pageId || '').trim()
    if (!pageId || !isValidFacebookPageId(pageId)) {
      res.status(400).json({
        code: 400,
        message: 'pageId 格式无效',
        data: null,
        meta: buildMeta(),
      })
      return
    }
    const token = getFacebookPageAccessToken(pageId)
    if (!token) {
      res.status(404).json({
        code: 404,
        message: '该主页未授权或已撤销',
        data: null,
        meta: buildMeta(),
      })
      return
    }
    const body = req.body as { message?: string; link?: string; scheduled_publish_time: number }
    const message = body.message?.trim()
    const link = body.link?.trim()
    const scheduledPublishTime = body.scheduled_publish_time
    if (!message && !link) {
      res.status(400).json({
        code: 400,
        message: '请提供 message 或 link',
        data: null,
        meta: buildMeta(),
      })
      return
    }
    if (
      typeof scheduledPublishTime !== 'number' ||
      scheduledPublishTime <= Math.floor(Date.now() / 1000)
    ) {
      res.status(400).json({
        code: 400,
        message: 'scheduled_publish_time 必须为未来的 Unix 时间戳（秒）',
        data: null,
        meta: buildMeta(),
      })
      return
    }
    try {
      const params: Record<string, string | number> = {
        published: 'false',
        scheduled_publish_time: scheduledPublishTime,
      }
      if (message) params.message = message
      if (link) params.link = link
      const formBody = new URLSearchParams()
      Object.entries(params).forEach(([k, v]) => formBody.set(k, String(v)))
      formBody.set('access_token', token)
      const graphRes = await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(pageId)}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody.toString(),
      })
      const result = (await graphRes.json()) as { id?: string; error?: { message: string } }
      if (result.error) {
        res.status(400).json({
          code: 400,
          message: result.error.message || '定时发帖失败',
          data: null,
          meta: buildMeta(),
        })
        return
      }
      res.json({
        code: 0,
        message: 'success',
        data: { postId: result.id },
        meta: buildMeta(),
      })
    } catch (e) {
      res.status(500).json({
        code: 500,
        message: e instanceof Error ? e.message : '定时发帖请求异常',
        data: null,
        meta: buildMeta(),
      })
    }
  })
}
