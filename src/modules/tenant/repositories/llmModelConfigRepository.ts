import type { LLMModelConfig } from '../schemas/llmExecutor'
import { parseResponseJson } from '@/core/api/safeParseResponse'

const API_BASE = typeof window !== 'undefined' ? '' : 'http://localhost:3001'

async function request<T>(url: string, options?: { method?: string; body?: unknown }): Promise<T> {
  const { body, method } = options ?? {}
  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const json = await parseResponseJson<{ code: number; message: string; data: T }>(res)
  if (res.ok && json.code === 0) return json.data
  throw new Error(json.message || `HTTP ${res.status}`)
}

export async function fetchModelConfigList(providerId?: string): Promise<LLMModelConfig[]> {
  const q = providerId ? `?providerId=${encodeURIComponent(providerId)}` : ''
  return request<LLMModelConfig[]>(`/api/llm-model-configs${q}`)
}

export async function fetchModelConfigById(id: string): Promise<LLMModelConfig | null> {
  return request<LLMModelConfig | null>(`/api/llm-model-configs/${id}`)
}

export async function createModelConfig(
  payload: Omit<LLMModelConfig, 'createdAt' | 'updatedAt'>
): Promise<LLMModelConfig> {
  return request<LLMModelConfig>('/api/llm-model-configs', { method: 'POST', body: payload })
}

export async function updateModelConfig(
  id: string,
  payload: Partial<Omit<LLMModelConfig, 'id' | 'createdAt'>>
): Promise<LLMModelConfig | null> {
  return request<LLMModelConfig | null>(`/api/llm-model-configs/${id}`, { method: 'PUT', body: payload })
}

export async function patchModelConfigEnabled(id: string, isEnabled: boolean): Promise<LLMModelConfig | null> {
  return request<LLMModelConfig | null>(`/api/llm-model-configs/${id}/enabled`, {
    method: 'PATCH',
    body: { isEnabled },
  })
}

export async function patchModelConfigDefault(id: string): Promise<LLMModelConfig | null> {
  return request<LLMModelConfig | null>(`/api/llm-model-configs/${id}/default`, { method: 'PATCH' })
}

export async function deleteModelConfig(id: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/api/llm-model-configs/${id}`, { method: 'DELETE' })
}
