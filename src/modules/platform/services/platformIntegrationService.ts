/**
 * 平台第三方集成配置服务
 * 从服务端 /api/platform-integrations/facebook 读写，用于平台设置页
 */

export interface FacebookIntegrationClientConfig {
  platform: 'facebook'
  appId: string
  appSecretMasked: string
  redirectUri: string
  /** 逗号分隔的 OAuth 权限范围，留空则使用默认 */
  scopes?: string
  isEnabled: boolean
  updatedAt: string
}

interface ApiResponse<T> {
  code: number
  message: string
  data: T
  meta: { requestId: string; timestamp: string }
}

export async function getFacebookIntegrationConfig(): Promise<FacebookIntegrationClientConfig | null> {
  const res = await fetch('/api/platform-integrations/facebook')
  const json = (await res.json()) as ApiResponse<FacebookIntegrationClientConfig | null>
  if (json.code !== 0) {
    throw new Error(json.message || '获取 Facebook 集成配置失败')
  }
  return json.data
}

export interface UpdateFacebookIntegrationInput {
  appId: string
  appSecret?: string
  redirectUri?: string
  scopes?: string
  isEnabled: boolean
}

export async function updateFacebookIntegrationConfig(
  payload: UpdateFacebookIntegrationInput
): Promise<FacebookIntegrationClientConfig> {
  const res = await fetch('/api/platform-integrations/facebook', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      appId: payload.appId,
      appSecret: payload.appSecret || undefined,
      redirectUri: payload.redirectUri,
      scopes: payload.scopes,
      isEnabled: payload.isEnabled,
    }),
  })
  const json = (await res.json()) as ApiResponse<Omit<FacebookIntegrationClientConfig, 'appSecret'> & { appSecret?: never }>
  if (json.code !== 0 || !json.data) {
    throw new Error(json.message || '保存 Facebook 集成配置失败')
  }
  return json.data as FacebookIntegrationClientConfig
}
