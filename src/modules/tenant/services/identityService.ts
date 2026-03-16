import type { ListResult } from '@/core/types/api'
import type { Identity, IdentityListParams, IdentityStatus } from '../schemas/identity'
import * as identityRepo from '../repositories/identityRepository'

export async function getIdentityList(params: IdentityListParams): Promise<ListResult<Identity>> {
  const res = await identityRepo.fetchIdentityList(params)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function getIdentityDetail(id: string): Promise<Identity | null> {
  const res = await identityRepo.fetchIdentityDetail(id)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function createIdentity(
  payload: Partial<Identity> & { name: string; tenantId: string }
): Promise<Identity> {
  const res = await identityRepo.createIdentity(payload)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function updateIdentity(id: string, payload: Partial<Identity>): Promise<Identity | null> {
  const res = await identityRepo.updateIdentity(id, payload)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function deleteIdentity(id: string): Promise<boolean> {
  const res = await identityRepo.deleteIdentity(id)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function patchIdentityStatus(
  id: string,
  status: IdentityStatus
): Promise<Identity | null> {
  const res = await identityRepo.patchIdentityStatus(id, status)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}
