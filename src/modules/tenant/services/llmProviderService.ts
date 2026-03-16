/**
 * LLM Provider 服务（Phase 17.5）
 * 模型提供商 CRUD 与状态管理（优先调用后端 API）
 */
import type { LLMProvider } from '../schemas/llmConfigCenter'
import * as repo from '../repositories/llmProviderRepository'

export async function listProviders(): Promise<LLMProvider[]> {
  return repo.fetchProviderList()
}

export async function getProviderById(id: string): Promise<LLMProvider | null> {
  return repo.fetchProviderById(id)
}

export async function createProvider(
  payload: Omit<LLMProvider, 'createdAt' | 'updatedAt'>
): Promise<LLMProvider> {
  return repo.createProvider(payload)
}

export async function updateProvider(
  id: string,
  payload: Partial<Omit<LLMProvider, 'id' | 'createdAt'>>
): Promise<LLMProvider | null> {
  return repo.updateProvider(id, payload)
}

export async function changeProviderStatus(id: string, status: LLMProvider['status']): Promise<LLMProvider | null> {
  return repo.patchProviderStatus(id, status)
}

export async function deleteProvider(id: string): Promise<boolean> {
  const res = await repo.deleteProvider(id)
  return res.success
}

/**
 * 测试 Provider 连接（Phase 17.7a）
 * 调用后端 /api/llm/test-provider
 */
export async function testProviderConnection(
  id: string
): Promise<{ ok: boolean; messageZh: string; latencyMs?: number }> {
  return repo.testProviderConnection(id)
}
