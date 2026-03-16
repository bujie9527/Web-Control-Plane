/**
 * 项目 SOP Mock，按 projectId 维度，每项目至多一条
 * sopParsed 为占位，不实现解析逻辑
 */
import type { ProjectSOP } from '../schemas/projectDomain'

const projectSOPByProject: Record<string, ProjectSOP | null> = {
  p1: {
    id: 'psop-p1',
    projectId: 'p1',
    sopRaw: '1. 每日 9:00 前由内容运营组产出当日选题与初稿；2. 经审核 Agent 一审后，人工抽检 10% 并确认发布；3. 选定身份（品牌官号或 KOC）后按渠道发布；4. 发布后 24h 内收集互动数据并回填看板。',
    sopParsed: null,
    status: 'active',
    version: '1.0',
    createdAt: '2025-02-10',
    updatedAt: '2025-03-01',
  },
  p2: {
    id: 'psop-p2',
    projectId: 'p2',
    sopRaw: '每日 6:00 触发数据拉取任务；依次调用各数据源 API 拉取昨日指标；写入看板库；8:00 前完成并发送完成通知。',
    sopParsed: null,
    status: 'active',
    version: '1.0',
    createdAt: '2025-01-20',
    updatedAt: '2025-02-15',
  },
  p3: {
    id: 'psop-p3',
    projectId: 'p3',
    sopRaw: '内容进入审核队列后，由审核 Agent 执行一审；一审通过进入人工抽检池；抽检通过则自动发布，未通过则退回修改。',
    sopParsed: null,
    status: 'draft',
    version: '0.9',
    createdAt: '2025-02-25',
    updatedAt: '2025-03-08',
  },
}

export function getSOPByProjectId(projectId: string): ProjectSOP | null {
  return projectSOPByProject[projectId] ?? null
}

export interface CreateSOPPayload {
  sopRaw: string
  status?: 'draft' | 'active'
}

export function createSOP(projectId: string, payload: CreateSOPPayload): ProjectSOP {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const id = `psop-${projectId}-${Date.now()}`
  const sop: ProjectSOP = {
    id,
    projectId,
    sopRaw: payload.sopRaw,
    sopParsed: null,
    status: payload.status ?? 'active',
    version: '1.0',
    createdAt: now,
    updatedAt: now,
  }
  projectSOPByProject[projectId] = sop
  return sop
}

export function updateSOP(projectId: string, payload: { sopRaw: string }): ProjectSOP {
  const existing = projectSOPByProject[projectId]
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  if (existing) {
    const updated: ProjectSOP = { ...existing, sopRaw: payload.sopRaw, updatedAt: now }
    projectSOPByProject[projectId] = updated
    return updated
  }
  return createSOP(projectId, { sopRaw: payload.sopRaw, status: 'active' })
}
