/**
 * LLM 模型配置服务（Phase 17.5）
 * 模型配置 CRUD、状态与默认项（优先调用后端 API）
 */
import type { LLMModelConfig } from '../schemas/llmExecutor'
import * as repo from '../repositories/llmModelConfigRepository'

export async function listModelConfigs(providerId?: string): Promise<LLMModelConfig[]> {
  return repo.fetchModelConfigList(providerId)
}

export async function getModelConfigById(id: string): Promise<LLMModelConfig | null> {
  return repo.fetchModelConfigById(id)
}

export async function getDefaultModelConfig(): Promise<LLMModelConfig | null> {
  const list = await repo.fetchModelConfigList()
  return list.find((c) => c.isDefault) ?? list[0] ?? null
}

export async function createModelConfig(
  payload: Omit<LLMModelConfig, 'createdAt' | 'updatedAt'>
): Promise<LLMModelConfig> {
  return repo.createModelConfig(payload)
}

export async function updateModelConfig(
  id: string,
  payload: Partial<Omit<LLMModelConfig, 'id' | 'createdAt'>>
): Promise<LLMModelConfig | null> {
  return repo.updateModelConfig(id, payload)
}

export async function changeModelConfigStatus(id: string, isEnabled: boolean): Promise<LLMModelConfig | null> {
  return repo.patchModelConfigEnabled(id, isEnabled)
}

export async function setDefaultModelConfig(id: string): Promise<LLMModelConfig | null> {
  return repo.patchModelConfigDefault(id)
}

export async function deleteModelConfig(id: string): Promise<boolean> {
  const res = await repo.deleteModelConfig(id)
  return res.success
}
