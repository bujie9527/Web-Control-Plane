/**
 * 流程监督决策持久化 — WorkflowSupervisorDecision
 * 批次 9：对应 Prisma 新增模型
 */
import { prisma } from './prismaClient'

const now = (): string => new Date().toISOString().slice(0, 19).replace('T', ' ')

export interface WorkflowSupervisorDecisionRow {
  id: string
  instanceId: string
  nodeId?: string | null
  decisionType: string
  reason: string
  suggestedNextAction?: string | null
  relatedErrorSummary?: string | null
  status: string // suggested | applied | dismissed
  appliedBy?: string | null
  appliedAt?: string | null
  createdAt: string
}

const now = (): string => new Date().toISOString().slice(0, 19).replace('T', ' ')

function rowToDecision(row: {
  id: string
  instanceId: string
  nodeId: string | null
  decisionType: string
  reason: string
  suggestedNextAction: string | null
  relatedErrorSummary: string | null
  status: string
  appliedBy: string | null
  appliedAt: string | null
  createdAt: string
}): WorkflowSupervisorDecisionRow {
  return {
    id: row.id,
    instanceId: row.instanceId,
    nodeId: row.nodeId ?? undefined,
    decisionType: row.decisionType,
    reason: row.reason,
    suggestedNextAction: row.suggestedNextAction ?? undefined,
    relatedErrorSummary: row.relatedErrorSummary ?? undefined,
    status: row.status,
    appliedBy: row.appliedBy ?? undefined,
    appliedAt: row.appliedAt ?? undefined,
    createdAt: row.createdAt,
  }
}

/** 按 ID 获取单条监督决策 */
export async function dbGetSupervisorDecisionById(
  id: string
): Promise<WorkflowSupervisorDecisionRow | null> {
  const row = await prisma.workflowSupervisorDecision.findUnique({ where: { id } })
  return row ? rowToDecision(row) : null
}

/** 获取实例的所有监督决策（按创建时间降序） */
export async function dbListSupervisorDecisions(
  instanceId: string
): Promise<WorkflowSupervisorDecisionRow[]> {
  const rows = await prisma.workflowSupervisorDecision.findMany({
    where: { instanceId },
    orderBy: { createdAt: 'desc' },
  })
  return rows.map(rowToDecision)
}

/** 创建监督决策 */
export async function dbCreateSupervisorDecision(payload: {
  instanceId: string
  nodeId?: string
  decisionType: string
  reason: string
  suggestedNextAction?: string
  relatedErrorSummary?: string
}): Promise<WorkflowSupervisorDecisionRow> {
  const ts = now()
  const row = await prisma.workflowSupervisorDecision.create({
    data: {
      instanceId: payload.instanceId,
      nodeId: payload.nodeId ?? null,
      decisionType: payload.decisionType,
      reason: payload.reason,
      suggestedNextAction: payload.suggestedNextAction ?? null,
      relatedErrorSummary: payload.relatedErrorSummary ?? null,
      status: 'suggested',
      createdAt: ts,
    },
  })
  return rowToDecision(row)
}

/** 更新决策状态（应用 / 忽略） */
export async function dbUpdateSupervisorDecisionStatus(
  id: string,
  status: 'applied' | 'dismissed',
  appliedBy?: string
): Promise<WorkflowSupervisorDecisionRow> {
  const ts = now()
  const row = await prisma.workflowSupervisorDecision.update({
    where: { id },
    data: {
      status,
      appliedBy: appliedBy ?? null,
      appliedAt: status === 'applied' ? ts : null,
    },
  })
  return rowToDecision(row)
}
