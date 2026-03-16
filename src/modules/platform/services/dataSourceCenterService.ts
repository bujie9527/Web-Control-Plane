import * as repo from '../repositories/dataSourceCenterRepository'
import type { DataSourceStatus } from '../schemas/dataSourceCenter'

export function listDataSourceCredentials() {
  return repo.fetchCredentials()
}

export function addDataSourceCredential(payload: {
  id?: string
  name: string
  nameZh?: string
  providerType: string
  secret: string
  status?: DataSourceStatus
  notes?: string
}) {
  return repo.createCredential(payload)
}

export function editDataSourceCredential(
  id: string,
  payload: Partial<{ name: string; nameZh: string; providerType: string; secret: string; status: DataSourceStatus; notes: string }>
) {
  return repo.updateCredential(id, payload)
}

export async function deleteDataSourceCredential(id: string) {
  const r = await repo.removeCredential(id)
  return r.success
}

export function listDataSourceProviders() {
  return repo.fetchProviders()
}

export function addDataSourceProvider(payload: {
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
  return repo.createProvider(payload)
}

export function editDataSourceProvider(
  id: string,
  payload: Partial<{ name: string; nameZh: string; providerType: string; baseUrl: string; credentialId: string; status: DataSourceStatus; isSystemPreset: boolean; notes: string }>
) {
  return repo.updateProvider(id, payload)
}

export async function deleteDataSourceProvider(id: string) {
  const r = await repo.removeProvider(id)
  return r.success
}

export function testDataSourceProvider(id: string) {
  return repo.testProvider(id)
}

export function listDataSourceConfigs() {
  return repo.fetchConfigs()
}

export function addDataSourceConfig(payload: {
  id?: string
  providerId: string
  tenantId?: string
  configJson?: string
  rateLimitJson?: string
  status?: DataSourceStatus
  notes?: string
}) {
  return repo.createConfig(payload)
}

export function editDataSourceConfig(
  id: string,
  payload: Partial<{ providerId: string; tenantId: string; configJson: string; rateLimitJson: string; status: DataSourceStatus; notes: string }>
) {
  return repo.updateConfig(id, payload)
}

export async function deleteDataSourceConfig(id: string) {
  const r = await repo.removeConfig(id)
  return r.success
}

export function runDataSourceExecute(payload: { providerId: string; query: string; limit?: number }) {
  return repo.executeProvider(payload)
}
