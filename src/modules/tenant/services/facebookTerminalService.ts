/**
 * Facebook 公共主页终端 Service
 * 统一封装 OAuth 授权、列表（Terminal 实例）、刷新 Token、发帖
 */
import type { Terminal } from '../schemas/terminal'
import type { ListResult } from '@/core/types/api'
import { getTerminalList, getTerminalById } from './terminalService'
import { getFacebookConfig } from './facebookAuthService'

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

async function request<T>(
  url: string,
  options?: { method?: string; body?: unknown }
): Promise<{ code: number; message: string; data: T }> {
  const res = await fetch(`${API_BASE}${url}`, {
    method: options?.method ?? 'GET',
    headers: getApiAuthHeaders(),
    credentials: 'include',
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
  })
  const json = (await res.json()) as { code: number; message: string; data: T }
  if (!res.ok || (json.code !== undefined && json.code !== 0)) {
    throw new Error(typeof json.message === 'string' ? json.message : '请求失败')
  }
  return json
}

export interface AuthorizeResult {
  created: Array<{ id: string; name: string; pageId: string }>
  updated: Array<{ id: string; name: string; pageId: string }>
  pageCount: number
}

/**
 * 使用 FB SDK 弹窗登录后，将 userAccessToken 提交服务端，创建/更新 Facebook 主页 Terminal 实例
 */
export async function authorizeWithFBSDK(
  tenantId: string,
  userAccessToken: string
): Promise<AuthorizeResult> {
  const result = await request<AuthorizeResult>('/api/facebook/auth/with-token', {
    method: 'POST',
    body: { tenantId: tenantId.trim(), userAccessToken: userAccessToken.trim() },
  })
  return result.data
}

/**
 * 获取 OAuth 授权 URL 并跳转（SDK 不可用时的降级）
 */
export async function initOAuthRedirect(tenantId: string): Promise<void> {
  const result = await request<{ authUrl: string }>('/api/facebook/auth/init', {
    method: 'POST',
    body: { tenantId: tenantId.trim() },
  })
  if (result.data?.authUrl) {
    window.location.href = result.data.authUrl
  } else {
    throw new Error('未获取到授权链接')
  }
}

/**
 * 列出当前租户下 type=facebook_page 的终端（已授权的主页）
 */
export async function listFacebookTerminals(
  tenantId: string,
  params?: { page?: number; pageSize?: number; status?: string }
): Promise<ListResult<Terminal>> {
  return getTerminalList({
    tenantId,
    type: 'facebook_page',
    page: params?.page,
    pageSize: params?.pageSize,
    status: params?.status,
  })
}

/**
 * 刷新终端 Token 校验（仅校验有效性，无效时提示重新授权）
 */
export async function refreshTerminalToken(terminalId: string): Promise<{ valid: boolean; message: string }> {
  try {
    const result = await request<{ valid: boolean }>(`/api/terminals/${encodeURIComponent(terminalId)}/refresh-token`, {
      method: 'POST',
    })
    return {
      valid: result.data?.valid ?? false,
      message: result.message ?? (result.data?.valid ? 'Token 有效' : '校验失败'),
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : '校验失败'
    return { valid: false, message }
  }
}

export interface PostToPagePayload {
  message?: string
  link?: string
}

export interface PostToPageResult {
  postId?: string
}

/**
 * 向指定 Facebook 主页终端发帖
 */
export async function postToPage(
  terminalId: string,
  payload: PostToPagePayload
): Promise<PostToPageResult> {
  const result = await request<PostToPageResult>(
    `/api/terminals/${encodeURIComponent(terminalId)}/actions/post`,
    {
      method: 'POST',
      body: payload,
    }
  )
  return result.data ?? {}
}

/**
 * 获取 Facebook 配置（用于 SDK 初始化），未配置时返回 null
 */
export async function getFacebookConfigForSDK(): Promise<{ appId: string; scopes: string } | null> {
  return getFacebookConfig()
}

/**
 * 获取单个终端详情（含 Facebook 类型）
 */
export async function getFacebookTerminalById(
  terminalId: string
): Promise<Terminal | null> {
  return getTerminalById(terminalId)
}
