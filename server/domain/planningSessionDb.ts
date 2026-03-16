/**
 * 流程规划会话 / 草案 / 消息 - 服务端持久化（Prisma + SQLite）
 * 与 src/modules/tenant/schemas/workflowPlanningSession 类型对齐，序列化 nodes 等为 JSON 存储
 */
import { prisma } from './prismaClient'

const now = (): string => new Date().toISOString().slice(0, 19).replace('T', ' ')

// ─── Session ─────────────────────────────────────────────────────────────────

export interface PlanningSessionListParams {
  page?: number
  pageSize?: number
  scopeType?: 'system' | 'tenant'
  tenantId?: string
  status?: string
  projectTypeId?: string
  deliverableMode?: string
  sourceType?: string
}

export async function dbListPlanningSessions(params: PlanningSessionListParams) {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const skip = (page - 1) * pageSize

  const where: Record<string, unknown> = {}
  if (params.scopeType) where.scopeType = params.scopeType
  if (params.tenantId) where.tenantId = params.tenantId
  if (params.status) where.status = params.status
  if (params.projectTypeId) where.projectTypeId = params.projectTypeId
  if (params.deliverableMode) where.deliverableMode = params.deliverableMode
  if (params.sourceType) where.sourceType = params.sourceType

  const [items, total] = await Promise.all([
    prisma.workflowPlanningSession.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.workflowPlanningSession.count({ where }),
  ])

  return {
    items: items.map(rowToSession),
    total,
  }
}

export async function dbGetPlanningSessionById(id: string) {
  const row = await prisma.workflowPlanningSession.findUnique({ where: { id } })
  return row ? rowToSession(row) : null
}

export async function dbCreatePlanningSession(payload: {
  scopeType: string
  tenantId?: string
  title: string
  description?: string
  projectTypeId: string
  goalTypeId: string
  deliverableMode: string
  sourceType: string
  sourceText?: string
  plannerAgentTemplateId?: string
  plannerExecutionBackend: string
  status: string
  createdBy: string
  sourceProjectId?: string
  sourceTemplateId?: string
  entryMode?: string
  capabilityPoolSnapshot?: Record<string, unknown>
}) {
  const ts = now()
  const row = await prisma.workflowPlanningSession.create({
    data: {
      scopeType: payload.scopeType,
      tenantId: payload.tenantId ?? null,
      title: payload.title,
      description: payload.description ?? null,
      projectTypeId: payload.projectTypeId,
      goalTypeId: payload.goalTypeId,
      deliverableMode: payload.deliverableMode,
      sourceType: payload.sourceType,
      sourceText: payload.sourceText ?? null,
      plannerAgentTemplateId: payload.plannerAgentTemplateId ?? null,
      plannerExecutionBackend: payload.plannerExecutionBackend,
      status: payload.status,
      createdBy: payload.createdBy,
      sourceProjectId: payload.sourceProjectId ?? null,
      sourceTemplateId: payload.sourceTemplateId ?? null,
      entryMode: payload.entryMode ?? null,
      capabilityPoolSnapshot: payload.capabilityPoolSnapshot
        ? JSON.stringify(payload.capabilityPoolSnapshot)
        : null,
      createdAt: ts,
      updatedAt: ts,
    },
  })
  return rowToSession(row)
}

export async function dbUpdatePlanningSessionStatus(id: string, status: string) {
  const row = await prisma.workflowPlanningSession.update({
    where: { id },
    data: { status, updatedAt: now() },
  })
  return rowToSession(row)
}

export async function dbSetCurrentDraft(sessionId: string, draftId: string) {
  const draft = await prisma.workflowPlanningDraft.findFirst({
    where: { id: draftId, sessionId },
  })
  if (!draft) return null
  const row = await prisma.workflowPlanningSession.update({
    where: { id: sessionId },
    data: { currentDraftId: draftId, updatedAt: now() },
  })
  return rowToSession(row)
}

export async function dbDeletePlanningSession(id: string) {
  await prisma.workflowPlanningSession.delete({ where: { id } })
  return true
}

function rowToSession(row: {
  id: string
  scopeType: string
  tenantId: string | null
  title: string
  description: string | null
  projectTypeId: string
  goalTypeId: string
  deliverableMode: string
  sourceType: string
  sourceText: string | null
  plannerAgentTemplateId: string | null
  plannerExecutionBackend: string
  currentDraftId: string | null
  status: string
  createdBy: string
  createdAt: string
  updatedAt: string
  sourceProjectId?: string | null
  sourceTemplateId?: string | null
  entryMode?: string | null
  capabilityPoolSnapshot?: string | null
}) {
  return {
    id: row.id,
    scopeType: row.scopeType as 'system' | 'tenant',
    tenantId: row.tenantId ?? undefined,
    title: row.title,
    description: row.description ?? undefined,
    projectTypeId: row.projectTypeId,
    goalTypeId: row.goalTypeId,
    deliverableMode: row.deliverableMode,
    sourceType: row.sourceType,
    sourceText: row.sourceText ?? undefined,
    plannerAgentTemplateId: row.plannerAgentTemplateId ?? undefined,
    plannerExecutionBackend: row.plannerExecutionBackend,
    currentDraftId: row.currentDraftId ?? undefined,
    status: row.status,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    sourceProjectId: row.sourceProjectId ?? undefined,
    sourceTemplateId: row.sourceTemplateId ?? undefined,
    entryMode: row.entryMode ?? undefined,
    capabilityPoolSnapshot: row.capabilityPoolSnapshot
      ? (JSON.parse(row.capabilityPoolSnapshot) as Record<string, unknown>)
      : undefined,
  }
}

// ─── Draft ───────────────────────────────────────────────────────────────────

export async function dbCreatePlanningDraft(payload: {
  sessionId: string
  version?: number
  summary?: string
  parsedSOP?: string
  nodes: unknown[]
  suggestedAgentTemplateIds?: string[]
  suggestedSkillIds?: string[]
  changeSummary?: string
  riskNotes?: string
  missingCapabilities?: string[]
  capabilityNotes?: string
  status: string
}) {
  const existing = await prisma.workflowPlanningDraft.findMany({
    where: { sessionId: payload.sessionId },
    orderBy: { version: 'desc' },
    take: 1,
  })
  const version = payload.version ?? (existing[0]?.version ?? 0) + 1
  const nodes = payload.nodes.map((n: unknown, i: number) => {
    const node = n as Record<string, unknown>
    return {
      ...node,
      id: node.id ?? `wpn-${Date.now()}-${i + 1}`,
      orderIndex: node.orderIndex ?? i + 1,
    }
  })

  const row = await prisma.workflowPlanningDraft.create({
    data: {
      sessionId: payload.sessionId,
      version,
      summary: payload.summary ?? null,
      parsedSOP: payload.parsedSOP ?? null,
      nodes: JSON.stringify(nodes),
      suggestedAgentTemplateIds: payload.suggestedAgentTemplateIds
        ? JSON.stringify(payload.suggestedAgentTemplateIds)
        : null,
      suggestedSkillIds: payload.suggestedSkillIds ? JSON.stringify(payload.suggestedSkillIds) : null,
      changeSummary: payload.changeSummary ?? null,
      riskNotes: payload.riskNotes ?? null,
      missingCapabilities: payload.missingCapabilities
        ? JSON.stringify(payload.missingCapabilities)
        : null,
      capabilityNotes: payload.capabilityNotes ?? null,
      status: payload.status,
      createdAt: now(),
    },
  })
  return rowToDraft(row)
}

export async function dbListPlanningDrafts(sessionId: string) {
  const rows = await prisma.workflowPlanningDraft.findMany({
    where: { sessionId },
    orderBy: { version: 'desc' },
  })
  return rows.map(rowToDraft)
}

export async function dbGetPlanningDraftById(id: string) {
  const row = await prisma.workflowPlanningDraft.findUnique({ where: { id } })
  return row ? rowToDraft(row) : null
}

function rowToDraft(row: {
  id: string
  sessionId: string
  version: number
  summary: string | null
  parsedSOP: string | null
  nodes: string
  suggestedAgentTemplateIds: string | null
  suggestedSkillIds: string | null
  changeSummary: string | null
  riskNotes: string | null
  missingCapabilities: string | null
  capabilityNotes: string | null
  status: string
  createdAt: string
  graphVersion?: number | null
  changeSet?: string | null
  validationSnapshot?: string | null
  canvasLayout?: string | null
}) {
  return {
    id: row.id,
    sessionId: row.sessionId,
    version: row.version,
    summary: row.summary ?? undefined,
    parsedSOP: row.parsedSOP ?? undefined,
    nodes: JSON.parse(row.nodes) as unknown[],
    suggestedAgentTemplateIds: row.suggestedAgentTemplateIds
      ? (JSON.parse(row.suggestedAgentTemplateIds) as string[])
      : undefined,
    suggestedSkillIds: row.suggestedSkillIds ? (JSON.parse(row.suggestedSkillIds) as string[]) : undefined,
    changeSummary: row.changeSummary ?? undefined,
    riskNotes: row.riskNotes ?? undefined,
    missingCapabilities: row.missingCapabilities
      ? (JSON.parse(row.missingCapabilities) as string[])
      : undefined,
    capabilityNotes: row.capabilityNotes ?? undefined,
    status: row.status,
    createdAt: row.createdAt,
    graphVersion: row.graphVersion ?? undefined,
    changeSet: row.changeSet ? (JSON.parse(row.changeSet) as Record<string, unknown>) : undefined,
    validationSnapshot: row.validationSnapshot
      ? (JSON.parse(row.validationSnapshot) as Record<string, unknown>)
      : undefined,
    canvasLayout: row.canvasLayout ? (JSON.parse(row.canvasLayout) as Record<string, unknown>) : undefined,
  }
}

// ─── Message ─────────────────────────────────────────────────────────────────

export async function dbAddPlanningMessage(payload: {
  sessionId: string
  role: string
  content: string
  relatedDraftVersion?: number
  messageType: string
}) {
  const row = await prisma.workflowPlanningMessage.create({
    data: {
      sessionId: payload.sessionId,
      role: payload.role,
      content: payload.content,
      relatedDraftVersion: payload.relatedDraftVersion ?? null,
      messageType: payload.messageType,
      createdAt: now(),
    },
  })
  return {
    id: row.id,
    sessionId: row.sessionId,
    role: row.role,
    content: row.content,
    relatedDraftVersion: row.relatedDraftVersion ?? undefined,
    messageType: row.messageType,
    createdAt: row.createdAt,
  }
}

export async function dbListPlanningMessages(sessionId: string) {
  const rows = await prisma.workflowPlanningMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  })
  return rows.map((row) => ({
    id: row.id,
    sessionId: row.sessionId,
    role: row.role,
    content: row.content,
    relatedDraftVersion: row.relatedDraftVersion ?? undefined,
    messageType: row.messageType,
    createdAt: row.createdAt,
  }))
}

export async function dbGetDraftNodesReferencingAgent(agentTemplateId: string) {
  const drafts = await prisma.workflowPlanningDraft.findMany()
  const result: Array<{ draftId: string; sessionId: string; nodeKey: string; nodeName: string; draftVersion: number }> = []
  for (const d of drafts) {
    const nodes = JSON.parse(d.nodes) as Array<{ key?: string; name?: string; recommendedAgentTemplateId?: string }>
    for (const n of nodes) {
      if (n.recommendedAgentTemplateId === agentTemplateId) {
        result.push({
          draftId: d.id,
          sessionId: d.sessionId,
          nodeKey: n.key ?? '',
          nodeName: n.name ?? '',
          draftVersion: d.version,
        })
      }
    }
  }
  return result
}
