import type { LLMProvider } from '../schemas/llmConfigCenter'
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

export async function fetchProviderList(): Promise<LLMProvider[]> {
  return request<LLMProvider[]>('/api/llm-providers')
}

export async function fetchProviderById(id: string): Promise<LLMProvider | null> {
  return request<LLMProvider | null>(`/api/llm-providers/${id}`)
}

export async function createProvider(
  payload: Omit<LLMProvider, 'createdAt' | 'updatedAt'>
): Promise<LLMProvider> {
  return request<LLMProvider>('/api/llm-providers', { method: 'POST', body: payload })
}

export async function updateProvider(
  id: string,
  payload: Partial<Omit<LLMProvider, 'id' | 'createdAt'>>
): Promise<LLMProvider | null> {
  return request<LLMProvider | null>(`/api/llm-providers/${id}`, { method: 'PUT', body: payload })
}

export async function patchProviderStatus(
  id: string,
  status: LLMProvider['status']
): Promise<LLMProvider | null> {
  return request<LLMProvider | null>(`/api/llm-providers/${id}/status`, {
    method: 'PATCH',
    body: { status },
  })
}

export async function deleteProvider(id: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/api/llm-providers/${id}`, { method: 'DELETE' })
}

export async function testProviderConnection(id: string): Promise<{ ok: boolean; messageZh: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/llm/test-provider`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId: id }),
    })
    if (!res.ok) {
      return { ok: false, messageZh: `服务端错误：HTTP ${res.status}` }
    }
    const data = (await res.json()) as { ok: boolean; messageZh: string }
    return { ok: data?.ok ?? false, messageZh: data?.messageZh ?? '测试连接失败' }
  } catch {
    return { ok: false, messageZh: '网络连接失败，无法测试' }
  }
}
