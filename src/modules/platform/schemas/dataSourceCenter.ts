export type DataSourceProviderType = 'tavily' | 'apify' | 'jina_reader' | 'rss'
export type DataSourceStatus = 'active' | 'disabled'

export interface DataSourceCredential {
  id: string
  name: string
  nameZh?: string
  providerType: DataSourceProviderType | string
  secretMasked: string
  status: DataSourceStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface DataSourceProvider {
  id: string
  name: string
  nameZh?: string
  providerType: DataSourceProviderType | string
  baseUrl?: string
  credentialId?: string
  status: DataSourceStatus
  isSystemPreset: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface DataSourceConfig {
  id: string
  providerId: string
  tenantId?: string
  configJson?: string
  rateLimitJson?: string
  status: DataSourceStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface DataSourceTestResult {
  ok: boolean
  messageZh: string
  latencyMs?: number
}

export interface DataSourceExecuteResult {
  providerId: string
  providerType: string
  items: Array<{ title: string; snippet: string; source: string; url?: string }>
  costTier: 'free' | 'paid'
}
