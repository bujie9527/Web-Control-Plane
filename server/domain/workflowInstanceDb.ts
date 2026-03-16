/**
 * WorkflowInstance / WorkflowInstanceNode / Task 服务端持久化（批次 5）
 */
import { prisma } from './prismaClient'

const now = (): string => new Date().toISOString().slice(0, 19).replace('T', ' ')

// ─── Instance：DB row → 前端兼容形状 ─────────────────────────────────────────

function rowToInstance(row: {
  id: string
  projectId: string
  workflowTemplateId: string
  status: string
  currentNodeKey: string | null
  createdAt: string
  updatedAt: string
}) {
  return {
    id: row.id,
    projectId: row.projectId,
    templateId: row.workflowTemplateId,
    workflowTemplateId: row.workflowTemplateId,
    status: row.status,
    currentNodeKey: row.currentNodeKey ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    identityId: undefined,
    sourceType: 'template' as const,
    sourceSummary: '',
  }
}

export async function dbListInstancesByProjectId(projectId: string) {
  const rows = await prisma.workflowInstance.findMany({
    where: { projectId },
    orderBy: { updatedAt: 'desc' },
  })
  return rows.map(rowToInstance)
}

export async function dbGetInstanceById(id: string) {
  const row = await prisma.workflowInstance.findUnique({ where: { id } })
  return row ? rowToInstance(row) : null
}

/** 按租户列出实例（通过 project.tenantId 过滤） */
export async function dbListInstancesForTenant(tenantId: string) {
  const projects = await prisma.project.findMany({
    where: { tenantId },
    select: { id: true },
  })
  const projectIds = projects.map((p) => p.id)
  const rows = await prisma.workflowInstance.findMany({
    where: { projectId: { in: projectIds } },
    orderBy: { updatedAt: 'desc' },
  })
  return rows.map(rowToInstance)
}

/** 按流程模板 ID 列出实例（用于引用检查） */
export async function dbListInstancesByTemplateId(workflowTemplateId: string) {
  const rows = await prisma.workflowInstance.findMany({
    where: { workflowTemplateId },
    orderBy: { updatedAt: 'desc' },
  })
  return rows.map(rowToInstance)
}

export async function dbCreateInstance(payload: {
  projectId: string
  workflowTemplateId: string
  identityId?: string
  status?: string
}) {
  const ts = now()
  const row = await prisma.workflowInstance.create({
    data: {
      projectId: payload.projectId,
      workflowTemplateId: payload.workflowTemplateId,
      status: payload.status ?? 'pending',
      createdAt: ts,
      updatedAt: ts,
    },
  })
  return rowToInstance(row)
}

export async function dbUpdateInstance(id: string, payload: Record<string, unknown>) {
  const ts = now()
  const data: Record<string, unknown> = { updatedAt: ts }
  if (payload.status !== undefined) data.status = payload.status as string
  if (payload.currentNodeKey !== undefined) data.currentNodeKey = payload.currentNodeKey as string | null
  await prisma.workflowInstance.update({
    where: { id },
    data: data as Record<string, string | null>,
  })
  return dbGetInstanceById(id)
}

// ─── Instance Node：DB row → 前端兼容形状 ──────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToInstanceNode(row: any) {
  let workerOutputJson: Record<string, unknown> | undefined
  let skillExecutionLog: Record<string, unknown> | undefined
  let channelStyleApplied: Record<string, unknown> | undefined
  if (row.workerOutputJson) {
    try {
      workerOutputJson = JSON.parse(row.workerOutputJson) as Record<string, unknown>
    } catch {
      workerOutputJson = undefined
    }
  }
  if (row.skillExecutionLog) {
    try {
      skillExecutionLog = JSON.parse(row.skillExecutionLog) as Record<string, unknown>
    } catch {
      skillExecutionLog = undefined
    }
  }
  if (row.channelStyleApplied) {
    try {
      channelStyleApplied = JSON.parse(row.channelStyleApplied) as Record<string, unknown>
    } catch {
      channelStyleApplied = undefined
    }
  }
  let selectedSkillIds: string[] | undefined
  if (row.selectedSkillIds) {
    try {
      const arr = JSON.parse(row.selectedSkillIds) as unknown
      selectedSkillIds = Array.isArray(arr) ? arr.map(String) : undefined
    } catch {
      selectedSkillIds = undefined
    }
  }
  return {
    id: row.id,
    workflowInstanceId: row.instanceId,
    templateNodeId: row.templateNodeId ?? undefined,
    nodeKey: row.key,
    nodeName: row.name,
    name: row.name,
    key: row.key,
    nodeType: 'agent' as const,
    executorType: 'agent' as const,
    status: row.status,
    orderIndex: row.orderIndex,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    resultSummary: row.resultSummary ?? undefined,
    workerOutputJson,
    errorSummary: row.errorSummary ?? undefined,
    reviewSummary: row.reviewSummary ?? undefined,
    retryCount: row.retryCount ?? 0,
    workerExecutionModel: row.workerExecutionModel ?? undefined,
    workerExecutionDurationMs: row.workerExecutionDurationMs ?? undefined,
    workerExecutionAgentId: row.workerExecutionAgentId ?? undefined,
    selectedAgentTemplateId: row.selectedAgentTemplateId ?? undefined,
    selectedSkillIds,
    skillExecutionLog,
    channelType: row.channelType ?? undefined,
    channelStyleApplied,
    recoveryStatus: row.recoveryStatus ?? undefined,
    lastRecoveryAction: row.lastRecoveryAction ?? undefined,
  }
}

export async function dbListInstanceNodes(instanceId: string) {
  const rows = await prisma.workflowInstanceNode.findMany({
    where: { instanceId },
    orderBy: { orderIndex: 'asc' },
  })
  return rows.map(rowToInstanceNode)
}

export async function dbGetInstanceNodeById(nodeId: string) {
  const row = await prisma.workflowInstanceNode.findUnique({
    where: { id: nodeId },
  })
  return row ? rowToInstanceNode(row) : null
}

export async function dbCreateInstanceNodes(
  instanceId: string,
  templateNodeRefs: { key: string; name: string; templateNodeId?: string; orderIndex: number }[]
) {
  const ts = now()
  const created = []
  for (let i = 0; i < templateNodeRefs.length; i++) {
    const ref = templateNodeRefs[i]
    const row = await prisma.workflowInstanceNode.create({
      data: {
        instanceId,
        templateNodeId: ref.templateNodeId ?? null,
        key: ref.key,
        name: ref.name,
        status: i === 0 ? 'running' : 'pending',
        orderIndex: ref.orderIndex,
        createdAt: ts,
        updatedAt: ts,
      },
    })
    created.push(rowToInstanceNode(row))
  }
  return created
}

export async function dbUpdateInstanceNode(id: string, payload: Record<string, unknown>) {
  const ts = now()
  const data: Record<string, unknown> = { updatedAt: ts }
  if (payload.status !== undefined) data.status = payload.status as string
  if (payload.resultSummary !== undefined) data.resultSummary = payload.resultSummary as string
  if (payload.workerOutputJson !== undefined)
    data.workerOutputJson =
      typeof payload.workerOutputJson === 'string'
        ? payload.workerOutputJson
        : JSON.stringify(payload.workerOutputJson)
  if (payload.errorSummary !== undefined) data.errorSummary = payload.errorSummary as string
  if (payload.reviewSummary !== undefined) data.reviewSummary = payload.reviewSummary as string
  if (payload.retryCount !== undefined) data.retryCount = payload.retryCount as number
  if (payload.workerExecutionModel !== undefined)
    data.workerExecutionModel = payload.workerExecutionModel as string
  if (payload.workerExecutionDurationMs !== undefined)
    data.workerExecutionDurationMs = payload.workerExecutionDurationMs as number
  if (payload.workerExecutionAgentId !== undefined)
    data.workerExecutionAgentId = payload.workerExecutionAgentId as string
  if (payload.selectedAgentTemplateId !== undefined)
    data.selectedAgentTemplateId = payload.selectedAgentTemplateId as string
  if (payload.selectedSkillIds !== undefined)
    data.selectedSkillIds = JSON.stringify(payload.selectedSkillIds)
  if (payload.skillExecutionLog !== undefined)
    data.skillExecutionLog = JSON.stringify(payload.skillExecutionLog)
  if (payload.channelType !== undefined) data.channelType = payload.channelType as string
  if (payload.channelStyleApplied !== undefined)
    data.channelStyleApplied = JSON.stringify(payload.channelStyleApplied)
  if (payload.recoveryStatus !== undefined) data.recoveryStatus = payload.recoveryStatus as string
  if (payload.lastRecoveryAction !== undefined)
    data.lastRecoveryAction = payload.lastRecoveryAction as string
  const row = await prisma.workflowInstanceNode.update({
    where: { id },
    data: data as Record<string, string | number | null>,
  })
  return rowToInstanceNode(row)
}

// ─── Task ────────────────────────────────────────────────────────────────────

function rowToTask(row: {
  id: string
  projectId: string
  workflowInstanceId: string | null
  workflowInstanceNodeId: string | null
  title: string
  status: string
  createdAt: string
  updatedAt: string
}) {
  return {
    id: row.id,
    projectId: row.projectId,
    workflowInstanceId: row.workflowInstanceId ?? undefined,
    workflowInstanceNodeId: row.workflowInstanceNodeId ?? undefined,
    title: row.title,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function dbListTasksByProjectId(projectId: string) {
  const rows = await prisma.task.findMany({
    where: { projectId },
    orderBy: { updatedAt: 'desc' },
  })
  return rows.map(rowToTask)
}

export async function dbGetTaskById(id: string) {
  const row = await prisma.task.findUnique({ where: { id } })
  return row ? rowToTask(row) : null
}

export async function dbCreateTask(payload: {
  projectId: string
  workflowInstanceId?: string
  workflowInstanceNodeId?: string
  title: string
  status?: string
}) {
  const ts = now()
  const row = await prisma.task.create({
    data: {
      projectId: payload.projectId,
      workflowInstanceId: payload.workflowInstanceId ?? null,
      workflowInstanceNodeId: payload.workflowInstanceNodeId ?? null,
      title: payload.title,
      status: payload.status ?? 'pending',
      createdAt: ts,
      updatedAt: ts,
    },
  })
  return rowToTask(row)
}

export async function dbUpdateTask(id: string, payload: Record<string, unknown>) {
  const ts = now()
  const data: Record<string, unknown> = { updatedAt: ts }
  if (payload.status !== undefined) data.status = payload.status as string
  if (payload.title !== undefined) data.title = payload.title as string
  const row = await prisma.task.update({
    where: { id },
    data: data as Record<string, string>,
  })
  return rowToTask(row)
}
