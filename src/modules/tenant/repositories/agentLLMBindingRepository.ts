import type { AgentLLMBinding } from '../schemas/llmConfigCenter'
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

export async function fetchBindingList(agentTemplateId?: string): Promise<AgentLLMBinding[]> {
  const q = agentTemplateId ? `?agentTemplateId=${encodeURIComponent(agentTemplateId)}` : ''
  return request<AgentLLMBinding[]>(`/api/agent-llm-bindings${q}`)
}

export async function createBinding(
  payload: Omit<AgentLLMBinding, 'id' | 'createdAt' | 'updatedAt'>
): Promise<AgentLLMBinding> {
  return request<AgentLLMBinding>('/api/agent-llm-bindings', { method: 'POST', body: payload })
}

export async function updateBinding(
  id: string,
  payload: Partial<Omit<AgentLLMBinding, 'id' | 'createdAt'>>
): Promise<AgentLLMBinding | null> {
  return request<AgentLLMBinding | null>(`/api/agent-llm-bindings/${id}`, { method: 'PUT', body: payload })
}

export async function deleteBinding(id: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/api/agent-llm-bindings/${id}`, { method: 'DELETE' })
}

export async function setPrimaryBinding(
  agentTemplateId: string,
  modelConfigId: string
): Promise<AgentLLMBinding> {
  return request<AgentLLMBinding>('/api/agent-llm-bindings/set-primary', {
    method: 'POST',
    body: { agentTemplateId, modelConfigId },
  })
}
