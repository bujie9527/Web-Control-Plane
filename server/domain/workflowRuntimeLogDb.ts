/**
 * 流程运行日志持久化 — WorkflowRuntimeLog
 * 批次 9：对应 Prisma 新增模型
 */
import { prisma } from './prismaClient'

const now = (): string => new Date().toISOString().slice(0, 19).replace('T', ' ')

export interface WorkflowRuntimeLogRow {
  id: string
  instanceId: string
  nodeId?: string | null
  eventType: string
  messageZh: string
  operatorId?: string | null
  meta?: string | null
  createdAt: string
}

function rowToLog(row: {
  id: string
  instanceId: string
  nodeId: string | null
  eventType: string
  messageZh: string
  operatorId: string | null
  meta: string | null
  createdAt: string
}): WorkflowRuntimeLogRow {
  return {
    id: row.id,
    instanceId: row.instanceId,
    nodeId: row.nodeId ?? undefined,
    eventType: row.eventType,
    messageZh: row.messageZh,
    operatorId: row.operatorId ?? undefined,
    meta: row.meta ?? undefined,
    createdAt: row.createdAt,
  }
}

/** 获取实例的所有运行日志（按时间升序） */
export async function dbListRuntimeLogs(instanceId: string): Promise<WorkflowRuntimeLogRow[]> {
  const rows = await prisma.workflowRuntimeLog.findMany({
    where: { instanceId },
    orderBy: { createdAt: 'asc' },
  })
  return rows.map(rowToLog)
}

/** 写入一条运行日志 */
export async function dbAppendRuntimeLog(payload: {
  instanceId: string
  nodeId?: string
  eventType: string
  messageZh: string
  operatorId?: string
  meta?: Record<string, unknown>
}): Promise<WorkflowRuntimeLogRow> {
  const ts = now()
  const row = await prisma.workflowRuntimeLog.create({
    data: {
      instanceId: payload.instanceId,
      nodeId: payload.nodeId ?? null,
      eventType: payload.eventType,
      messageZh: payload.messageZh,
      operatorId: payload.operatorId ?? null,
      meta: payload.meta ? JSON.stringify(payload.meta) : null,
      createdAt: ts,
    },
  })
  return rowToLog(row)
}
