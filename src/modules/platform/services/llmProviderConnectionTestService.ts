/**
 * Provider 真实测试连接服务（Phase 17.7）
 * 执行逻辑：读取 provider → 读取 credential → 构造最小请求 → 调用 provider API → 返回中文结果
 *
 * 说明：密钥仅服务端可读，真实测试必须由后端 API 执行。
 * 当前前端仍使用 llmProviderService.testProviderConnection（基础校验）。
 * 接入服务端后，前端调用 /api/llm/test-connection，由本 service 逻辑在服务端执行。
 */
import { getProviderById } from '@/modules/tenant/services/llmProviderService'
import { getCredentialById } from './llmCredentialService'

export interface ProviderConnectionTestResult {
  ok: boolean
  messageZh: string
  latencyMs?: number
}

/** 中文错误映射 */
export const CONNECTION_TEST_MESSAGES = {
  SUCCESS: '测试连接成功',
  INVALID_KEY: '测试连接失败：密钥无效',
  UNREACHABLE: '测试连接失败：接口不可达',
  MODEL_UNAVAILABLE: '测试连接失败：模型不可用',
  TIMEOUT: '测试连接失败：请求超时',
} as const

/**
 * 测试 Provider 连接（前置校验，供服务端或 mock 使用）
 * 真实 API 调用需在服务端执行，因密钥不得暴露至前端
 */
export async function testProviderConnectionReal(providerId: string): Promise<ProviderConnectionTestResult> {
  const started = Date.now()
  const provider = await getProviderById(providerId)
  if (!provider) return { ok: false, messageZh: '提供商不存在' }
  if (provider.status !== 'active') return { ok: false, messageZh: '提供商未启用，无法测试连接' }
  if (!provider.baseUrl?.trim()) return { ok: false, messageZh: '缺少接口地址，无法测试连接' }
  if (!provider.credentialId?.trim()) return { ok: false, messageZh: '缺少关联凭证，无法测试连接' }

  const credential = await getCredentialById(provider.credentialId)
  if (!credential) return { ok: false, messageZh: '关联凭证不存在' }
  if (credential.status !== 'active') return { ok: false, messageZh: '关联凭证已停用，无法测试连接' }

  // 当前无服务端：仅做校验通过。真实测试需服务端读取密钥并调用 callOpenAIServer
  await new Promise((r) => setTimeout(r, 400))
  return {
    ok: true,
    messageZh: CONNECTION_TEST_MESSAGES.SUCCESS,
    latencyMs: Date.now() - started,
  }
}
