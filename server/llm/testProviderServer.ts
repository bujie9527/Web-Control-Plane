/**
 * 服务端 Provider 测试连接（Phase 17.7a）
 * 真实读取 Provider 与 Credential，发最小测试请求
 */
import { getCredentialSecret } from './serverStore'
import { getProviderByIdFromDb, getFirstModelKeyByProviderFromDb } from './serverStoreDb'
import { mapOpenAIErrorToZh, mapNetworkErrorToZh } from './llmApiErrorMapper'

export interface TestProviderResult {
  ok: boolean
  messageZh: string
  latencyMs?: number
}

export async function testProviderConnection(providerId: string): Promise<TestProviderResult> {
  const started = Date.now()

  const provider = await getProviderByIdFromDb(providerId)
  if (!provider) {
    return { ok: false, messageZh: '提供商不存在' }
  }
  if (provider.status !== 'active') {
    return { ok: false, messageZh: '提供商未启用，无法测试连接' }
  }
  if (!provider.baseUrl?.trim()) {
    return { ok: false, messageZh: '缺少接口地址，无法测试连接' }
  }
  if (!provider.credentialId) {
    return { ok: false, messageZh: '缺少关联凭证，无法测试连接' }
  }

  const apiKey = getCredentialSecret(provider.credentialId)
  if (!apiKey) {
    return {
      ok: false,
      messageZh: `凭证密钥未配置或凭证不存在（凭证ID: ${provider.credentialId}），请在模型配置中心 → LLM 凭证中创建并填写密钥`,
      latencyMs: Date.now() - started,
    }
  }

  const testModel = (await getFirstModelKeyByProviderFromDb(providerId)) ?? 'gpt-4o-mini'
  const baseUrl = provider.baseUrl.replace(/\/$/, '')
  const url = `${baseUrl}/chat/completions`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: testModel,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 5,
      }),
    })

    const latencyMs = Date.now() - started

    if (res.ok) {
      return { ok: true, messageZh: '测试连接成功', latencyMs }
    }

    const errBody = await res.text()
    let bodyMsg: string | undefined
    try {
      const parsed = JSON.parse(errBody)
      bodyMsg = parsed.error?.message
    } catch {
      bodyMsg = errBody.slice(0, 100)
    }

    const { errorMessageZh } = mapOpenAIErrorToZh(res.status, bodyMsg)
    return { ok: false, messageZh: errorMessageZh, latencyMs }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    const { errorMessageZh } = mapNetworkErrorToZh(msg)
    return {
      ok: false,
      messageZh: errorMessageZh,
      latencyMs: Date.now() - started,
    }
  }
}
