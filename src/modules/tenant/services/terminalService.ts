import type { Terminal, TerminalLogItem } from '../schemas/terminal'
import type { ListResult } from '@/core/types/api'
import * as terminalRepo from '../repositories/terminalRepository'
import type { TerminalListParams } from '../repositories/terminalRepository'
import { getIdentityDetail } from './identityService'

export interface TerminalOverview {
  total: number
  api: number
  browser: number
  mcp: number
}

export interface TerminalWithIdentity extends Terminal {
  identityName?: string
}

export async function getTerminalList(params: TerminalListParams): Promise<ListResult<TerminalWithIdentity>> {
  const res = await terminalRepo.fetchTerminalList(params)
  if (res.code !== 0) throw new Error(res.message)
  const { items, total } = res.data
  const enriched: TerminalWithIdentity[] = await Promise.all(
    items.map(async (t) => {
      const identityId = t.identityId ?? t.primaryIdentityId
      const identityName = identityId ? (await getIdentityDetail(identityId))?.name : undefined
      return { ...t, primaryIdentityId: identityId ?? t.primaryIdentityId, identityName }
    })
  )
  return { items: enriched, total }
}

export async function getTerminalById(id: string): Promise<TerminalWithIdentity | null> {
  const res = await terminalRepo.fetchTerminalDetail(id)
  if (res.code !== 0) throw new Error(res.message)
  const t = res.data
  if (!t) return null
  const identityId = t.identityId ?? t.primaryIdentityId
  const identityName = identityId ? (await getIdentityDetail(identityId))?.name : undefined
  return { ...t, primaryIdentityId: identityId ?? t.primaryIdentityId, identityName }
}

export async function createTerminal(
  tenantId: string,
  payload: Parameters<typeof terminalRepo.createTerminal>[1]
): Promise<Terminal> {
  const res = await terminalRepo.createTerminal(tenantId, payload)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function updateTerminal(
  id: string,
  payload: Parameters<typeof terminalRepo.updateTerminal>[1]
): Promise<Terminal | null> {
  const res = await terminalRepo.updateTerminal(id, payload)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function deleteTerminal(id: string): Promise<{ success: boolean }> {
  const res = await terminalRepo.deleteTerminal(id)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function patchTerminalStatus(id: string, status: string): Promise<Terminal | null> {
  const res = await terminalRepo.patchTerminalStatus(id, status)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function testConnection(
  payload: Parameters<typeof terminalRepo.testConnectionTerminal>[0]
): Promise<{ success: boolean; message?: string }> {
  const res = await terminalRepo.testConnectionTerminal(payload)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function testTerminalById(id: string): Promise<Terminal | null> {
  const res = await terminalRepo.testTerminalById(id)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function getTerminalOverview(tenantId: string): Promise<TerminalOverview> {
  const res = await terminalRepo.fetchTerminalList({ tenantId, page: 1, pageSize: 200 })
  if (res.code !== 0) return { total: 0, api: 0, browser: 0, mcp: 0 }
  const items = res.data.items
  return {
    total: items.length,
    api: items.filter((t) => t.typeCategory === 'api').length,
    browser: items.filter((t) => t.typeCategory === 'browser').length,
    mcp: items.filter((t) => t.typeCategory === 'mcp').length,
  }
}

/** 最近终端操作日志（当前无后端 API，返回空数组） */
export async function getRecentTerminalLogs(
  _tenantId: string,
  _limit?: number
): Promise<TerminalLogItem[]> {
  return []
}
