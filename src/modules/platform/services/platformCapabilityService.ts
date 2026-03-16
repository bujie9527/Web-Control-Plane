import type {
  ListResult,
  PlatformCapability,
  PlatformCapabilityListParams,
} from '@/core/schemas/platformCapability'
import * as repo from '../repositories/platformCapabilityRepository'

export async function getCapabilities(
  params?: PlatformCapabilityListParams
): Promise<ListResult<PlatformCapability>> {
  const res = await repo.fetchCapabilities(params)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function getCapabilityByCode(code: string): Promise<PlatformCapability> {
  const res = await repo.fetchCapabilityByCode(code)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function enableCapability(id: string): Promise<PlatformCapability> {
  const res = await repo.patchCapabilityStatus(id, 'active')
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function disableCapability(id: string): Promise<PlatformCapability> {
  const res = await repo.patchCapabilityStatus(id, 'disabled')
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}
