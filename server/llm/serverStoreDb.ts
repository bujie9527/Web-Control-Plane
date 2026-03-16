/**
 * 服务端 LLM 数据（从 Prisma 读取，替代 serverStore 硬编码）
 * Phase A：Provider / ModelConfig / AgentLLMBinding 从 DB 读取
 */
import * as llmConfigDb from '../domain/llmConfigDb'

export interface ServerProvider {
  id: string
  name: string
  nameZh: string
  providerType: string
  baseUrl?: string
  credentialId?: string
  status: string
}

export interface ServerModelConfig {
  id: string
  name: string
  nameZh: string
  providerId?: string
  modelKey: string
  isEnabled: boolean
  temperature: number
  maxTokens: number
  timeoutMs: number
  retryCount: number
  structuredOutputMode: string
}

export interface ServerBinding {
  id: string
  agentTemplateId: string
  modelConfigId: string
  bindingType: string
  isEnabled: boolean
}

/** 从 DB 获取 Provider（按 id） */
export async function getProviderByIdFromDb(id: string): Promise<ServerProvider | null> {
  const row = await llmConfigDb.dbGetProviderById(id)
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    nameZh: row.nameZh ?? row.name,
    providerType: row.providerType,
    baseUrl: row.baseUrl,
    credentialId: row.credentialId,
    status: row.status,
  }
}

/** 从 DB 获取 ModelConfig（按 id） */
export async function getModelConfigByIdFromDb(id: string): Promise<ServerModelConfig | null> {
  const row = await llmConfigDb.dbGetModelConfigById(id)
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    nameZh: row.nameZh ?? row.name,
    providerId: row.providerId,
    modelKey: row.modelKey,
    isEnabled: row.isEnabled,
    temperature: row.temperature,
    maxTokens: row.maxTokens,
    timeoutMs: row.timeoutMs,
    retryCount: row.retryCount,
    structuredOutputMode: row.structuredOutputMode,
  }
}

/** 从 DB 获取 Agent 的主模型绑定（primary + isEnabled） */
export async function getPrimaryBindingByAgentFromDb(
  agentTemplateId: string
): Promise<ServerBinding | null> {
  const list = await llmConfigDb.dbListBindings(agentTemplateId)
  const primary = list.find((b) => b.bindingType === 'primary' && b.isEnabled)
  if (!primary) return null
  return {
    id: primary.id,
    agentTemplateId: primary.agentTemplateId,
    modelConfigId: primary.modelConfigId,
    bindingType: primary.bindingType,
    isEnabled: primary.isEnabled,
  }
}

/** 从 DB 获取某 Provider 下第一个启用的 modelKey（用于测试连接） */
export async function getFirstModelKeyByProviderFromDb(providerId: string): Promise<string | null> {
  const configs = await llmConfigDb.dbListModelConfigs(providerId)
  const first = configs.find((c) => c.isEnabled)
  return first?.modelKey ?? null
}
