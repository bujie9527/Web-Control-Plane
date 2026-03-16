import type { ListResult } from '@/core/types/api'
import type {
  SystemTerminalType,
  SystemTerminalTypeListParams,
  SystemTerminalTypeStatus,
  SystemTerminalTypeUsage,
} from '../schemas/systemTerminalType'
import * as repo from '../repositories/systemTerminalTypeRepository'

export async function getSystemTerminalTypeList(
  params: SystemTerminalTypeListParams
): Promise<ListResult<SystemTerminalType>> {
  const res = await repo.fetchSystemTerminalTypeList(params)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function getSystemTerminalTypeById(id: string): Promise<SystemTerminalType | null> {
  const res = await repo.fetchSystemTerminalTypeById(id)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function getSystemTerminalTypeUsage(id: string): Promise<SystemTerminalTypeUsage> {
  const res = await repo.fetchSystemTerminalTypeUsage(id)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function createSystemTerminalType(
  payload: Omit<SystemTerminalType, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SystemTerminalType> {
  const res = await repo.createSystemTerminalType(payload)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function updateSystemTerminalType(
  id: string,
  payload: Partial<Omit<SystemTerminalType, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<SystemTerminalType | null> {
  const res = await repo.updateSystemTerminalType(id, payload)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function changeSystemTerminalTypeStatus(
  id: string,
  status: SystemTerminalTypeStatus
): Promise<SystemTerminalType | null> {
  const res = await repo.changeSystemTerminalTypeStatus(id, status)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function deleteSystemTerminalType(id: string): Promise<{ success: boolean }> {
  const res = await repo.deleteSystemTerminalType(id)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}
