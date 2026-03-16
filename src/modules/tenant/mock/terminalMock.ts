/**
 * 终端 Mock：租户级终端列表与总览
 */
import type { Terminal, TerminalStatus } from '../schemas/terminal'

/** 租户终端列表（多租户隔离） */
const _terminals: Terminal[] = [
  {
    id: 'term-fb-1',
    tenantId: 't1',
    name: 'FB 主账号',
    type: '社媒',
    status: 'active',
    primaryIdentityId: 'id1',
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-03-01T00:00:00Z',
  },
  {
    id: 'term-x-1',
    tenantId: 't1',
    name: 'X 主账号',
    type: '社媒',
    status: 'active',
    primaryIdentityId: 'id2',
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-03-01T00:00:00Z',
  },
  {
    id: 'term-tiktok-1',
    tenantId: 't1',
    name: 'TikTok 主账号',
    type: '社媒',
    status: 'active',
    createdAt: '2025-02-15T00:00:00Z',
    updatedAt: '2025-03-01T00:00:00Z',
  },
  {
    id: 'term-chrome-1',
    tenantId: 't1',
    name: 'Chrome 自动化-1',
    type: 'Web',
    status: 'active',
    createdAt: '2025-02-10T00:00:00Z',
    updatedAt: '2025-03-01T00:00:00Z',
  },
  {
    id: 'term-api-1',
    tenantId: 't1',
    name: '数据接口-日更',
    type: 'API',
    status: 'active',
    createdAt: '2025-02-05T00:00:00Z',
    updatedAt: '2025-03-01T00:00:00Z',
  },
  {
    id: 'term-demo-1',
    tenantId: 'tenant-demo-001',
    name: 'FB 主账号',
    type: '社媒',
    status: 'active',
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-03-01T00:00:00Z',
  },
  {
    id: 'term-demo-2',
    tenantId: 'tenant-demo-001',
    name: 'X 主账号',
    type: '社媒',
    status: 'active',
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-03-01T00:00:00Z',
  },
]

export interface TerminalListParams {
  tenantId: string
  page?: number
  pageSize?: number
  keyword?: string
  type?: string
  status?: TerminalStatus
}

export interface TerminalOverview {
  total: number
  social: number
  web: number
  system: number
  api: number
}

export function listTerminals(params: TerminalListParams): { items: Terminal[]; total: number } {
  const { tenantId, page = 1, pageSize = 20, keyword, type, status } = params
  let list = _terminals.filter((t) => t.tenantId === tenantId)
  if (keyword) {
    const k = keyword.toLowerCase()
    list = list.filter((t) => t.name.toLowerCase().includes(k) || (t.type && t.type.toLowerCase().includes(k)))
  }
  if (type) list = list.filter((t) => t.type === type)
  if (status) list = list.filter((t) => t.status === status)
  const total = list.length
  const start = (page - 1) * pageSize
  const items = list.slice(start, start + pageSize)
  return { items, total }
}

export function getTerminalOverview(tenantId: string): TerminalOverview {
  const list = _terminals.filter((t) => t.tenantId === tenantId)
  const social = list.filter((t) => t.type === '社媒').length
  const web = list.filter((t) => t.type === 'Web').length
  const system = list.filter((t) => t.type === '系统').length
  const api = list.filter((t) => t.type === 'API').length
  return {
    total: list.length,
    social,
    web,
    system,
    api,
  }
}

export type { TerminalLogItem } from '../schemas/terminal'
import type { TerminalLogItem } from '../schemas/terminal'

export function getRecentTerminalLogs(_tenantId: string, _limit = 10): TerminalLogItem[] {
  return [
    { id: 'l1', action: '执行任务', terminal: 'FB 主账号', result: '成功', time: '2025-03-08 10:30' },
    { id: 'l2', action: '发布内容', terminal: 'X 主账号', result: '成功', time: '2025-03-08 10:15' },
    { id: 'l3', action: '数据拉取', terminal: '数据接口-日更', result: '成功', time: '2025-03-08 09:00' },
  ]
}
