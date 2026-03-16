import type { ListResult, Tenant, TenantDetail, TenantListParams, TenantStatus } from '../schemas/tenant'
import * as tenantRepo from '../repositories/tenantRepository'

export async function getTenantList(params: TenantListParams): Promise<ListResult<Tenant>> {
  const res = await tenantRepo.fetchTenantList(params)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function getTenantDetail(id: string): Promise<TenantDetail | null> {
  const res = await tenantRepo.fetchTenantDetail(id)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function createTenant(payload: { name: string; code: string; [key: string]: unknown }): Promise<Tenant> {
  const res = await tenantRepo.createTenant(payload as Parameters<typeof tenantRepo.createTenant>[0])
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function updateTenant(id: string, payload: Partial<Tenant>): Promise<Tenant | null> {
  const res = await tenantRepo.updateTenant(id, payload)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function deleteTenant(id: string): Promise<boolean> {
  const res = await tenantRepo.deleteTenant(id)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function patchTenantStatus(id: string, status: TenantStatus): Promise<Tenant | null> {
  const res = await tenantRepo.patchTenantStatus(id, status)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}
