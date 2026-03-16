/**
 * 服务端 LLM 解析服务（Phase 17.7a / Phase A）
 * 根据 agentTemplateId 或 modelConfigId 解析最终可执行配置，从 Prisma 读取 Provider/Binding
 */
import { getCredentialSecret } from './serverStore'
import {
  getProviderByIdFromDb,
  getModelConfigByIdFromDb,
  getPrimaryBindingByAgentFromDb,
} from './serverStoreDb'

export interface ResolvedConfig {
  modelKey: string
  temperature: number
  maxTokens: number
  baseUrl: string
  apiKey: string
  providerId: string
  modelConfigId: string
}

export interface ResolveError {
  code: string
  messageZh: string
}

export async function resolveModelConfigByAgent(
  agentTemplateId: string
): Promise<{ config: ResolvedConfig } | { error: ResolveError }> {
  const binding = await getPrimaryBindingByAgentFromDb(agentTemplateId)
  if (!binding) {
    return { error: { code: 'BINDING_NOT_FOUND', messageZh: `未配置 Agent「${agentTemplateId}」的主模型绑定` } }
  }
  return resolveByModelConfigId(binding.modelConfigId)
}

export async function resolveByModelConfigId(
  modelConfigId: string
): Promise<{ config: ResolvedConfig } | { error: ResolveError }> {
  const config = await getModelConfigByIdFromDb(modelConfigId)
  if (!config) {
    return { error: { code: 'MODEL_CONFIG_NOT_FOUND', messageZh: '模型配置不存在' } }
  }
  if (!config.isEnabled) {
    return { error: { code: 'MODEL_CONFIG_DISABLED', messageZh: '模型配置已停用' } }
  }

  const providerId = config.providerId?.trim()
  if (!providerId) {
    return { error: { code: 'PROVIDER_NOT_CONFIGURED', messageZh: '模型配置未关联提供商' } }
  }
  const provider = await getProviderByIdFromDb(providerId)
  if (!provider) {
    return { error: { code: 'PROVIDER_NOT_FOUND', messageZh: '提供商不存在' } }
  }
  if (provider.status !== 'active') {
    return { error: { code: 'PROVIDER_DISABLED', messageZh: '提供商未启用' } }
  }

  const credentialId = provider.credentialId
  if (!credentialId) {
    return { error: { code: 'CREDENTIAL_NOT_BOUND', messageZh: '提供商未关联凭证' } }
  }

  const apiKey = getCredentialSecret(credentialId)
  if (!apiKey) {
    return {
      error: {
        code: 'CREDENTIAL_NOT_CONFIGURED',
        messageZh: '凭证密钥未配置，请在平台后台的 LLM 凭证中填写密钥',
      },
    }
  }

  const baseUrl = provider.baseUrl?.trim() || 'https://api.openai.com/v1'

  return {
    config: {
      modelKey: config.modelKey,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      baseUrl,
      apiKey,
      providerId,
      modelConfigId: config.id,
    },
  }
}
