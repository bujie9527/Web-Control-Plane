/**
 * Facebook 主页授权与页面列表 Service
 * 调用服务端 /api/facebook/* 接口
 */
import type { FacebookPageCredentialSummary } from '../schemas/facebookPageCredential'

const API_BASE = ''

function getApiAuthHeaders(): Record<string, string> {
  const secret =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_SECRET
      ? String(import.meta.env.VITE_API_SECRET).trim()
      : ''
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (secret) headers['Authorization'] = `Bearer ${secret}`
  return headers
}

async function request<T>(url: string, options?: { method?: string; body?: unknown }): Promise<{ code: number; message: string; data: T }> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}${url}`, {
      method: options?.method ?? 'GET',
      headers: getApiAuthHeaders(),
      credentials: 'include',
      body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
  } catch (e) {
    if (e instanceof TypeError && (e.message === 'Failed to fetch' || e.message.includes('fetch'))) {
      throw new Error('网络连接失败，请检查网络')
    }
    throw e
  }
  if (!res.ok) {
    const status = res.status
    let serverMsg: string | null = null
    try {
      const body = (await res.json()) as { message?: string; code?: number }
      if (typeof body?.message === 'string' && body.message.trim()) serverMsg = body.message.trim()
    } catch {
      // 非 JSON 或无 message 时忽略
    }
    const msg =
      serverMsg ||
      (status === 401 ? '未授权，请登录或配置 API 密钥' :
      status >= 500 ? '服务暂时不可用，请稍后重试' :
      status >= 400 ? '请求错误，请检查参数' :
      '请求失败')
    throw new Error(msg)
  }
  let json: { code?: number; message?: string; data: T }
  try {
    json = (await res.json()) as { code: number; message: string; data: T }
  } catch {
    throw new Error('服务返回格式异常')
  }
  if (json.code !== undefined && json.code !== 0) {
    throw new Error(typeof json.message === 'string' ? json.message : '请求失败')
  }
  return json as { code: number; message: string; data: T }
}

/** 默认仅 pages_show_list；完整权限需在 Meta 应用添加 Pages API 用例后，在平台设置中配置 */
const DEFAULT_FB_SCOPES = 'pages_show_list'

/** 获取前端 Facebook SDK 所需配置（appId、scopes），未配置时返回 null */
export async function getFacebookConfig(): Promise<{ appId: string; scopes: string } | null> {
  const result = await request<{ appId?: string; scopes?: string } | null>('/api/facebook/config')
  if (result.code !== 0) return null
  const d = result.data
  if (!d?.appId) return null
  return {
    appId: d.appId,
    scopes: (d.scopes ?? '').trim() || DEFAULT_FB_SCOPES,
  }
}

/** 使用用户 Access Token 换取主页列表并保存到服务端（弹窗登录后调用） */
export async function submitFacebookUserToken(userAccessToken: string): Promise<{ pageCount: number }> {
  const result = await request<{ pageCount: number }>('/api/facebook/auth/with-token', {
    method: 'POST',
    body: { userAccessToken: userAccessToken.trim() },
  })
  if (result.code !== 0) throw new Error(result.message || '保存失败')
  return result.data ?? { pageCount: 0 }
}

/** 获取授权 URL，用于跳转 Meta OAuth（SDK 不可用时的备用方式） */
export async function initFacebookAuth(): Promise<{ authUrl: string }> {
  const result = await request<{ authUrl: string }>('/api/facebook/auth/init', { method: 'POST' })
  if (result.code !== 0) throw new Error(result.message || '获取授权链接失败')
  return result.data
}

/** 获取已授权主页列表（脱敏） */
export async function listFacebookPages(): Promise<FacebookPageCredentialSummary[]> {
  const result = await request<FacebookPageCredentialSummary[]>('/api/facebook/pages')
  if (result.code !== 0) throw new Error(result.message || '获取主页列表失败')
  return result.data ?? []
}

/** 撤销某主页授权 */
export async function revokeFacebookPage(pageId: string): Promise<boolean> {
  const result = await request<{ revoked: boolean }>(`/api/facebook/pages/${encodeURIComponent(pageId)}/revoke`, {
    method: 'DELETE',
  })
  if (result.code !== 0) throw new Error(result.message || '撤销授权失败')
  return result.data?.revoked ?? false
}
