import { parseResponseJson } from '@/core/api/safeParseResponse'
import type {
  DataSourceConfig,
  DataSourceCredential,
  DataSourceExecuteResult,
  DataSourceProvider,
  DataSourceStatus,
  DataSourceTestResult,
} from '../schemas/dataSourceCenter'

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

export function fetchCredentials() {
  return request<DataSourceCredential[]>('/api/data-source-credentials')
}

export function createCredential(payload: {
  id?: string
  name: string
  nameZh?: string
  providerType: string
  secret: string
  status?: DataSourceStatus
  notes?: string
}) {
  return request<DataSourceCredential>('/api/data-source-credentials', { method: 'POST', body: payload })
}

export function updateCredential(id: string, payload: Partial<{ name: string; nameZh: string; providerType: string; secret: string; status: DataSourceStatus; notes: string }>) {
  return request<DataSourceCredential | null>(`/api/data-source-credentials/${id}`, { method: 'PUT', body: payload })
}

export function removeCredential(id: string) {
  return request<{ success: boolean }>(`/api/data-source-credentials/${id}`, { method: 'DELETE' })
}

export function fetchProviders() {
  return request<DataSourceProvider[]>('/api/data-source-providers')
}

export function createProvider(payload: {
  id?: string
  name: string
  nameZh?: string
  providerType: string
  baseUrl?: string
  credentialId?: string
  status?: DataSourceStatus
  isSystemPreset?: boolean
  notes?: string
}) {
  return request<DataSourceProvider>('/api/data-source-providers', { method: 'POST', body: payload })
}

export function updateProvider(id: string, payload: Partial<{ name: string; nameZh: string; providerType: string; baseUrl: string; credentialId: string; status: DataSourceStatus; isSystemPreset: boolean; notes: string }>) {
  return request<DataSourceProvider | null>(`/api/data-source-providers/${id}`, { method: 'PUT', body: payload })
}

export function removeProvider(id: string) {
  return request<{ success: boolean }>(`/api/data-source-providers/${id}`, { method: 'DELETE' })
}

export function testProvider(id: string) {
  return request<DataSourceTestResult>(`/api/data-source-providers/${id}/test`, { method: 'POST' })
}

export function fetchConfigs() {
  return request<DataSourceConfig[]>('/api/data-source-configs')
}

export function createConfig(payload: {
  id?: string
  providerId: string
  tenantId?: string
  configJson?: string
  rateLimitJson?: string
  status?: DataSourceStatus
  notes?: string
}) {
  return request<DataSourceConfig>('/api/data-source-configs', { method: 'POST', body: payload })
}

export function updateConfig(id: string, payload: Partial<{ providerId: string; tenantId: string; configJson: string; rateLimitJson: string; status: DataSourceStatus; notes: string }>) {
  return request<DataSourceConfig | null>(`/api/data-source-configs/${id}`, { method: 'PUT', body: payload })
}

export function removeConfig(id: string) {
  return request<{ success: boolean }>(`/api/data-source-configs/${id}`, { method: 'DELETE' })
}

export function executeProvider(payload: { providerId: string; query: string; limit?: number }) {
  return request<DataSourceExecuteResult>('/api/data-source/execute', { method: 'POST', body: payload })
}
