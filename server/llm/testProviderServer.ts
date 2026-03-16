/**
 * 服务端 Provider 测试连接（Phase 17.7a）
 * 真实读取 Provider 与 Credential，发最小测试请求
 */
import { getServerCredentialSecret } from '../data/credentialStore'
import { getProviderByIdFromDb, getFirstModelKeyByProviderFromDb } from './serverStoreDb'
import { mapOpenAIErrorToZh, mapNetworkErrorToZh } from './llmApiErrorMapper'

export interface TestProviderResult {
  ok: boolean
  messageZh: string
  latencyMs?: number
  testModelKey?: string
  testModelSource?: 'request' | 'model_config'
}

export async function testProviderConnection(
  providerId: string,
  options?: { testModelKey?: string }
): Promise<TestProviderResult> {
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

  const apiKey = getServerCredentialSecret(provider.credentialId)
  if (!apiKey) {
    return {
      ok: false,
      messageZh: `凭证密钥未配置或凭证不存在（凭证ID: ${provider.credentialId}），请在模型配置中心 → LLM 凭证中创建并填写密钥`,
      latencyMs: Date.now() - started,
    }
  }

  const requestModel = options?.testModelKey?.trim()
  const modelFromConfig = await getFirstModelKeyByProviderFromDb(providerId)
  const testModel = requestModel || modelFromConfig
  const testModelSource: TestProviderResult['testModelSource'] = requestModel ? 'request' : 'model_config'
  if (!testModel) {
    return {
      ok: false,
      messageZh: '该提供商尚未配置可用模型。请先新增并启用模型配置，或在测试时手动输入模型标识（如 qwen3.5-plus）。',
      latencyMs: Date.now() - started,
    }
  }
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
      return {
        ok: true,
        messageZh: '测试连接成功',
        latencyMs,
        testModelKey: testModel,
        testModelSource,
      }
    }

    const errBody = await res.text()
    let bodyMsg: string | undefined
    try {
      const parsed = JSON.parse(errBody)
      bodyMsg = parsed.error?.message
    } catch {
      bodyMsg = errBody.slice(0, 100)
    }
    if (bodyMsg && /model\s+[`'"]?.+[`'"]?\s+is not supported|model.+does not exist/i.test(bodyMsg)) {
      return {
        ok: false,
        messageZh: `测试连接失败：模型不可用（${testModel}）。请改用该提供商支持的模型标识，或先在“模型配置”中配置正确的 modelKey。`,
        latencyMs,
        testModelKey: testModel,
        testModelSource,
      }
    }

    const { errorMessageZh } = mapOpenAIErrorToZh(res.status, bodyMsg)
    return {
      ok: false,
      messageZh: errorMessageZh,
      latencyMs,
      testModelKey: testModel,
      testModelSource,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    const { errorMessageZh } = mapNetworkErrorToZh(msg)
    return {
      ok: false,
      messageZh: errorMessageZh,
      latencyMs: Date.now() - started,
      testModelKey: testModel,
      testModelSource,
    }
  }
}
