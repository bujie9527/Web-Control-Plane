import type { LLMProvider } from '../schemas/llmConfigCenter'

const _providers: LLMProvider[] = [
  {
    id: 'provider-openai',
    name: 'OpenAI',
    nameZh: 'OpenAI',
    providerType: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    credentialId: 'cred-openai-1',
    status: 'active',
    notes: '主 Provider，用于规划与 Worker 模型',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'provider-openai-compatible',
    name: 'OpenAI Compatible',
    nameZh: 'OpenAI 兼容',
    providerType: 'openai_compatible',
    baseUrl: '',
    credentialId: undefined,
    status: 'disabled',
    notes: '预留：兼容 OpenAI 格式的自建或第三方',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
]

export function listLLMProviders(): LLMProvider[] {
  return [..._providers]
}

export function getLLMProviderById(id: string): LLMProvider | null {
  return _providers.find((p) => p.id === id) ?? null
}

export function createLLMProvider(payload: Omit<LLMProvider, 'createdAt' | 'updatedAt'>): LLMProvider {
  const now = new Date().toISOString()
  const entity: LLMProvider = {
    ...payload,
    createdAt: now,
    updatedAt: now,
  }
  _providers.push(entity)
  return entity
}

export function updateLLMProvider(id: string, payload: Partial<Omit<LLMProvider, 'id' | 'createdAt'>>): LLMProvider | null {
  const idx = _providers.findIndex((p) => p.id === id)
  if (idx < 0) return null
  _providers[idx] = { ..._providers[idx], ...payload, updatedAt: new Date().toISOString() }
  return _providers[idx]
}

export function changeLLMProviderStatus(id: string, status: LLMProvider['status']): LLMProvider | null {
  return updateLLMProvider(id, { status })
}

export function deleteLLMProvider(id: string): boolean {
  const idx = _providers.findIndex((p) => p.id === id)
  if (idx < 0) return false
  _providers.splice(idx, 1)
  return true
}

export interface ProviderConnectionTestResult {
  ok: boolean
  messageZh: string
}

/**
 * 测试提供商连接（Phase 17.6）
 * 本阶段为 mock：做基础校验并返回可读中文结果
 */
export async function testLLMProviderConnection(id: string): Promise<ProviderConnectionTestResult> {
  const p = getLLMProviderById(id)
  if (!p) return { ok: false, messageZh: '提供商不存在' }
  if (p.status !== 'active') return { ok: false, messageZh: '提供商未启用，无法测试连接' }
  if (!p.baseUrl?.trim()) return { ok: false, messageZh: '缺少接口地址，无法测试连接' }
  if (!p.credentialId?.trim()) return { ok: false, messageZh: '缺少关联凭证，无法测试连接' }

  // mock latency
  await new Promise((r) => setTimeout(r, 500))
  return { ok: true, messageZh: '测试连接成功' }
}
