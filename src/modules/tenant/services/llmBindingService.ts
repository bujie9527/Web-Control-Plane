/**
 * Agent 与模型绑定服务（Phase 17.5）
 * 通过绑定关系解析 Agent 使用的主模型 / 备用模型（优先调用后端 API）
 */
import type { LLMModelConfig } from '../schemas/llmExecutor'
import type { AgentLLMBinding } from '../schemas/llmConfigCenter'
import * as bindingRepo from '../repositories/agentLLMBindingRepository'
import * as configRepo from '../repositories/llmModelConfigRepository'

export async function listBindings(agentTemplateId?: string): Promise<AgentLLMBinding[]> {
  return bindingRepo.fetchBindingList(agentTemplateId)
}

export async function getBindingsByAgent(agentTemplateId: string): Promise<AgentLLMBinding[]> {
  return bindingRepo.fetchBindingList(agentTemplateId)
}

/**
 * 获取指定 Agent 的主模型配置（供 Adapter / Executor 使用）
 * 同步版本从 mock 读取，供服务端或非异步上下文使用；异步版本从 API 读取
 */
let _bindingsCache: AgentLLMBinding[] | null = null
let _configsCache: Map<string, LLMModelConfig | null> = new Map()

export function listBindingsSync(): AgentLLMBinding[] {
  return _bindingsCache ?? []
}

export function getAgentPrimaryModelConfig(agentTemplateId: string): LLMModelConfig | null {
  const bindings = _bindingsCache ?? []
  const primary = bindings.find(
    (b) => b.agentTemplateId === agentTemplateId && b.bindingType === 'primary' && b.isEnabled
  )
  if (!primary) return null
  return _configsCache.get(primary.modelConfigId) ?? null
}

/**
 * 刷新绑定与模型配置缓存（在配置中心加载后或绑定变更后调用）
 */
export function setBindingsAndConfigsCache(
  bindings: AgentLLMBinding[],
  configs: LLMModelConfig[]
): void {
  _bindingsCache = bindings
  _configsCache = new Map(configs.map((c) => [c.id, c]))
}

export async function getAgentPrimaryModelConfigAsync(agentTemplateId: string): Promise<LLMModelConfig | null> {
  const bindings = await bindingRepo.fetchBindingList(agentTemplateId)
  const primary = bindings.find(
    (b) => b.bindingType === 'primary' && b.isEnabled
  )
  if (!primary) return null
  return configRepo.fetchModelConfigById(primary.modelConfigId)
}

export async function getAgentFallbackModelConfig(agentTemplateId: string): Promise<LLMModelConfig | null> {
  const bindings = await bindingRepo.fetchBindingList(agentTemplateId)
  const fallback = bindings.find(
    (b) => b.bindingType === 'fallback' && b.isEnabled
  )
  if (!fallback) return null
  return configRepo.fetchModelConfigById(fallback.modelConfigId)
}

export async function createBinding(
  payload: Omit<AgentLLMBinding, 'id' | 'createdAt' | 'updatedAt'>
): Promise<AgentLLMBinding> {
  return bindingRepo.createBinding(payload)
}

export async function updateBinding(
  id: string,
  payload: Partial<Omit<AgentLLMBinding, 'id' | 'createdAt'>>
): Promise<AgentLLMBinding | null> {
  return bindingRepo.updateBinding(id, payload)
}

export async function deleteBinding(id: string): Promise<boolean> {
  const res = await bindingRepo.deleteBinding(id)
  return res.success
}

export async function setPrimaryBindingForAgent(
  agentTemplateId: string,
  modelConfigId: string
): Promise<AgentLLMBinding> {
  return bindingRepo.setPrimaryBinding(agentTemplateId, modelConfigId)
}

export async function setFallbackBindingForAgent(
  _agentTemplateId: string,
  _modelConfigId: string
): Promise<AgentLLMBinding> {
  return bindingRepo.createBinding({
    agentTemplateId: _agentTemplateId,
    modelConfigId: _modelConfigId,
    bindingType: 'fallback',
    priority: 1,
    isEnabled: true,
  })
}
