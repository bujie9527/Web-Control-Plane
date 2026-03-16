/**
 * 项目交付标的 Mock，按 projectId 维度
 */
import type { ProjectDeliverable, ProjectDeliverableType } from '../schemas/projectDomain'

const projectDeliverablesByProject: Record<string, ProjectDeliverable[]> = {
  p1: [
    {
      id: 'pd1-p1',
      projectId: 'p1',
      deliverableType: 'content' as ProjectDeliverableType,
      deliverableName: '社媒日更内容',
      description: '每日各渠道发布 1～2 条品牌或活动相关内容',
      frequency: '每日',
      targetValue: '30',
      unit: '条/月',
      createdAt: '2025-02-01',
      updatedAt: '2025-03-08',
    },
    {
      id: 'pd2-p1',
      projectId: 'p1',
      deliverableType: 'leads' as ProjectDeliverableType,
      deliverableName: '私域新增用户',
      description: '通过内容与活动引导至企微/社群',
      frequency: '每月',
      targetValue: '500',
      unit: '人',
      createdAt: '2025-02-01',
      updatedAt: '2025-03-08',
    },
  ],
  p2: [
    {
      id: 'pd1-p2',
      projectId: 'p2',
      deliverableType: 'data' as ProjectDeliverableType,
      deliverableName: '看板数据更新',
      description: '核心指标表每日自动更新',
      frequency: '每日',
      targetValue: '1',
      unit: '次',
      createdAt: '2025-01-15',
      updatedAt: '2025-03-08',
    },
  ],
  p3: [
    {
      id: 'pd1-p3',
      projectId: 'p3',
      deliverableType: 'content' as ProjectDeliverableType,
      deliverableName: '审核通过内容',
      description: '经审核流程通过并发布的内容条数',
      frequency: '每日',
      targetValue: '100',
      unit: '条',
      createdAt: '2025-02-20',
      updatedAt: '2025-03-08',
    },
  ],
}

export function getDeliverablesByProjectId(projectId: string): ProjectDeliverable[] {
  return projectDeliverablesByProject[projectId] ?? []
}

export interface CreateDeliverablePayload {
  deliverableType: ProjectDeliverableType
  deliverableName: string
  description?: string
  frequency?: string
  targetValue?: string
  unit?: string
}

export function createDeliverable(
  projectId: string,
  payload: CreateDeliverablePayload
): ProjectDeliverable {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const id = `pd-${projectId}-${Date.now()}`
  const d: ProjectDeliverable = {
    id,
    projectId,
    deliverableType: payload.deliverableType,
    deliverableName: payload.deliverableName,
    description: payload.description,
    frequency: payload.frequency,
    targetValue: payload.targetValue,
    unit: payload.unit,
    createdAt: now,
    updatedAt: now,
  }
  if (!projectDeliverablesByProject[projectId]) projectDeliverablesByProject[projectId] = []
  projectDeliverablesByProject[projectId].push(d)
  return d
}
