import { prisma } from './prismaClient'
import CronParser from 'cron-parser'

const now = (): string => new Date().toISOString().slice(0, 19).replace('T', ' ')

function calcNextRunAt(cronExpr: string | null): string | null {
  if (!cronExpr) return null
  try {
    const interval = CronParser.parse(cronExpr)
    return interval.next().toDate().toISOString().slice(0, 19).replace('T', ' ')
  } catch {
    const oneMinuteLater = new Date(Date.now() + 60_000)
    return oneMinuteLater.toISOString().slice(0, 19).replace('T', ' ')
  }
}

function parseJson(value?: string | null): Record<string, unknown> | undefined {
  if (!value) return undefined
  try {
    return JSON.parse(value) as Record<string, unknown>
  } catch {
    return undefined
  }
}

export async function dbListScheduledTasks(tenantId: string) {
  const rows = await prisma.scheduledTask.findMany({
    where: { tenantId },
    orderBy: { updatedAt: 'desc' },
  })
  return rows.map((r) => ({ ...r, payloadJson: parseJson(r.payloadJson) }))
}

export async function dbGetScheduledTask(id: string) {
  const row = await prisma.scheduledTask.findUnique({ where: { id } })
  return row ? { ...row, payloadJson: parseJson(row.payloadJson) } : null
}

export async function dbCreateScheduledTask(payload: {
  tenantId: string
  projectId?: string
  name: string
  description?: string
  cronExpr?: string
  runAt?: string
  timezone?: string
  targetType: 'workflow_instance' | 'skill_execution' | 'system'
  targetRefId?: string
  payloadJson?: Record<string, unknown>
  maxFailCount?: number
}) {
  const ts = now()
  const nextRunAt = payload.runAt ?? ts
  const row = await prisma.scheduledTask.create({
    data: {
      tenantId: payload.tenantId,
      projectId: payload.projectId ?? null,
      name: payload.name,
      description: payload.description ?? null,
      cronExpr: payload.cronExpr ?? null,
      runAt: payload.runAt ?? null,
      timezone: payload.timezone ?? null,
      targetType: payload.targetType,
      targetRefId: payload.targetRefId ?? null,
      payloadJson: payload.payloadJson ? JSON.stringify(payload.payloadJson) : null,
      status: 'active',
      nextRunAt,
      maxFailCount: payload.maxFailCount ?? 3,
      createdAt: ts,
      updatedAt: ts,
    },
  })
  return { ...row, payloadJson: parseJson(row.payloadJson) }
}

export async function dbUpdateScheduledTask(id: string, payload: Record<string, unknown>) {
  const ts = now()
  const data: Record<string, unknown> = { updatedAt: ts }
  if (payload.name !== undefined) data.name = String(payload.name)
  if (payload.description !== undefined) data.description = payload.description ? String(payload.description) : null
  if (payload.cronExpr !== undefined) data.cronExpr = payload.cronExpr ? String(payload.cronExpr) : null
  if (payload.runAt !== undefined) data.runAt = payload.runAt ? String(payload.runAt) : null
  if (payload.targetType !== undefined) data.targetType = String(payload.targetType)
  if (payload.targetRefId !== undefined) data.targetRefId = payload.targetRefId ? String(payload.targetRefId) : null
  if (payload.payloadJson !== undefined) data.payloadJson = JSON.stringify(payload.payloadJson)
  if (payload.nextRunAt !== undefined) data.nextRunAt = payload.nextRunAt ? String(payload.nextRunAt) : null
  const row = await prisma.scheduledTask.update({
    where: { id },
    data: data as Record<string, string | number | null>,
  })
  return { ...row, payloadJson: parseJson(row.payloadJson) }
}

export async function dbPatchScheduledTaskStatus(id: string, status: 'active' | 'paused' | 'completed' | 'failed') {
  const ts = now()
  return prisma.scheduledTask.update({
    where: { id },
    data: { status, updatedAt: ts },
  })
}

export async function dbDeleteScheduledTask(id: string) {
  await prisma.scheduledTaskExecution.deleteMany({ where: { taskId: id } })
  await prisma.scheduledTask.delete({ where: { id } })
  return true
}

export async function dbListDueScheduledTasks() {
  const ts = now()
  return prisma.scheduledTask.findMany({
    where: {
      status: 'active',
      OR: [{ nextRunAt: null }, { nextRunAt: { lte: ts } }],
    },
    orderBy: { createdAt: 'asc' },
    take: 20,
  })
}

export async function dbCreateScheduledTaskExecution(payload: {
  taskId: string
  triggerSource: 'scheduler' | 'manual'
}) {
  const ts = now()
  return prisma.scheduledTaskExecution.create({
    data: {
      taskId: payload.taskId,
      status: 'running',
      startedAt: ts,
      triggerSource: payload.triggerSource,
      createdAt: ts,
      updatedAt: ts,
    },
  })
}

export async function dbFinishScheduledTaskExecution(payload: {
  executionId: string
  taskId: string
  success: boolean
  resultSummary?: string
  errorSummary?: string
}) {
  const ts = now()
  await prisma.scheduledTaskExecution.update({
    where: { id: payload.executionId },
    data: {
      status: payload.success ? 'succeeded' : 'failed',
      finishedAt: ts,
      resultSummary: payload.resultSummary ?? null,
      errorSummary: payload.errorSummary ?? null,
      updatedAt: ts,
    },
  })
  const task = await prisma.scheduledTask.findUnique({ where: { id: payload.taskId } })
  if (!task) return
  const nextFailCount = payload.success ? 0 : (task.failCount ?? 0) + 1
  const shouldPause = nextFailCount >= (task.maxFailCount ?? 3)
  await prisma.scheduledTask.update({
    where: { id: payload.taskId },
    data: {
      failCount: nextFailCount,
      status: shouldPause ? 'paused' : task.status,
      lastRunAt: ts,
      nextRunAt: task.cronExpr ? calcNextRunAt(task.cronExpr) : null,
      updatedAt: ts,
    },
  })
}

export async function dbListTaskExecutions(taskId: string) {
  return prisma.scheduledTaskExecution.findMany({
    where: { taskId },
    orderBy: { startedAt: 'desc' },
    take: 100,
  })
}

