/**
 * Facebook 发帖 Service
 * 调用服务端 /api/facebook/pages/:pageId/posts 接口，错误中文化
 */

export interface PublishPostPayload {
  message?: string
  link?: string
}

export interface SchedulePostPayload extends PublishPostPayload {
  scheduled_publish_time: number
}

export interface PublishResult {
  postId: string
}

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

const ERROR_MSG_MAP: Record<string, string> = {
  '缺少 pageId': '请指定主页',
  '该主页未授权或已撤销': '该主页未授权或已撤销，请先完成授权',
  '请提供 message 或 link': '请填写帖子内容或链接',
  'scheduled_publish_time 必须为未来的 Unix 时间戳（秒）': '定时发布时间必须为未来时间',
}

function normalizeError(msg: string): string {
  return ERROR_MSG_MAP[msg] ?? msg
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: getApiAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(body),
    })
  } catch (e) {
    if (e instanceof TypeError && (e.message === 'Failed to fetch' || e.message.includes('fetch'))) {
      throw new Error('网络连接失败，请检查网络')
    }
    throw e
  }
  if (!res.ok) {
    const status = res.status
    const msg =
      status === 401 ? '未授权，请登录或配置 API 密钥' :
      status >= 500 ? '服务暂时不可用，请稍后重试' :
      status >= 400 ? '请求错误，请检查参数' :
      '请求失败'
    throw new Error(msg)
  }
  let json: { code?: number; message?: string; data: T }
  try {
    json = (await res.json()) as { code: number; message: string; data: T }
  } catch {
    throw new Error('服务返回格式异常')
  }
  if (json.code !== 0) {
    throw new Error(normalizeError(typeof json.message === 'string' ? json.message : '发帖失败'))
  }
  return (json as { code: number; message: string; data: T }).data
}

/** 立即发布帖子 */
export async function publishPost(pageId: string, payload: PublishPostPayload): Promise<PublishResult> {
  return postJson<PublishResult>(`/api/facebook/pages/${encodeURIComponent(pageId)}/posts`, payload)
}

/** 定时发帖 */
export async function schedulePost(pageId: string, payload: SchedulePostPayload): Promise<PublishResult> {
  return postJson<PublishResult>(`/api/facebook/pages/${encodeURIComponent(pageId)}/posts/schedule`, payload)
}
