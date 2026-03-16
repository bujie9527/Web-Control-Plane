import type { LLMModelConfig } from '../schemas/llmExecutor'

const _configs: LLMModelConfig[] = [
  {
    id: 'llm-openai-main',
    name: 'OpenAI GPT-4o',
    nameZh: 'OpenAI 主规划模型',
    providerId: 'provider-openai',
    provider: 'openai_compatible',
    modelKey: 'gpt-4o',
    isEnabled: true,
    isDefault: true,
    temperature: 0.4,
    maxTokens: 4096,
    timeoutMs: 20000,
    retryCount: 1,
    structuredOutputMode: 'json_schema',
    fallbackModelKey: 'gpt-4o-mini',
    fallbackModelConfigId: 'llm-openai-worker',
    supportedAgentCategories: ['planning'],
    notes: 'Base Workflow Planner 主模型',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'llm-openai-worker',
    name: 'OpenAI GPT-4o Mini (Worker)',
    nameZh: 'Worker 执行模型',
    providerId: 'provider-openai',
    provider: 'openai',
    modelKey: 'gpt-4o-mini',
    isEnabled: true,
    isDefault: false,
    temperature: 0.6,
    maxTokens: 2048,
    timeoutMs: 30000,
    retryCount: 1,
    structuredOutputMode: 'json_object',
    fallbackModelKey: 'gpt-3.5-turbo',
    supportedAgentCategories: ['planning', 'execution'],
    notes: 'Content Creator / Content Reviewer',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
]

export function listLLMModelConfigs(): LLMModelConfig[] {
  return [..._configs]
}

export function getLLMModelConfigById(id: string): LLMModelConfig | null {
  return _configs.find((c) => c.id === id) ?? null
}

export function getDefaultLLMModelConfig(): LLMModelConfig | null {
  return _configs.find((c) => c.isDefault && c.isEnabled) ?? null
}

export function createLLMModelConfig(
  payload: Omit<LLMModelConfig, 'createdAt' | 'updatedAt'>
): LLMModelConfig {
  const now = new Date().toISOString()
  const entity: LLMModelConfig = {
    ...payload,
    createdAt: now,
    updatedAt: now,
  }
  _configs.push(entity)
  return entity
}

export function updateLLMModelConfig(
  id: string,
  payload: Partial<Omit<LLMModelConfig, 'id' | 'createdAt'>>
): LLMModelConfig | null {
  const idx = _configs.findIndex((c) => c.id === id)
  if (idx < 0) return null
  _configs[idx] = { ..._configs[idx], ...payload, updatedAt: new Date().toISOString() }
  return _configs[idx]
}

export function changeLLMModelConfigStatus(id: string, isEnabled: boolean): LLMModelConfig | null {
  return updateLLMModelConfig(id, { isEnabled })
}

export function deleteLLMModelConfig(id: string): boolean {
  const idx = _configs.findIndex((c) => c.id === id)
  if (idx < 0) return false
  _configs.splice(idx, 1)
  return true
}

/**
 * 设为默认模型（Phase 17.6）
 * 同一范围内（当前 mock 全局）只允许一个默认项
 */
export function setDefaultLLMModelConfig(id: string): LLMModelConfig | null {
  const target = getLLMModelConfigById(id)
  if (!target) return null
  if (!target.isEnabled) return null
  _configs.forEach((c, idx) => {
    const next = { ...c }
    next.isDefault = c.id === id
    if (next.isDefault !== c.isDefault) {
      next.updatedAt = new Date().toISOString()
      _configs[idx] = next
    }
  })
  return getLLMModelConfigById(id)
}
