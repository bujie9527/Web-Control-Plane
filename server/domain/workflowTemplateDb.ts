/**
 * WorkflowTemplate / WorkflowTemplateNode 服务端持久化（批次 4）
 */
import { prisma } from './prismaClient'

const now = (): string => new Date().toISOString().slice(0, 19).replace('T', ' ')

function parseJsonArray(s: string | null): string[] {
  if (!s) return []
  try {
    const a = JSON.parse(s)
    return Array.isArray(a) ? a : []
  } catch {
    return []
  }
}

// ─── Template：DB row → 前端兼容形状 ─────────────────────────────────────────

function rowToTemplate(row: {
  id: string
  scopeType: string
  tenantId: string | null
  name: string
  code: string | null
  description: string | null
  status: string
  version: number
  nodeCount: number
  supportedProjectTypeId: string | null
  supportedGoalTypeIds: string | null
  supportedDeliverableModes: string | null
  createdAt: string
  updatedAt: string
}) {
  return {
    id: row.id,
    name: row.name,
    code: row.code ?? row.id,
    type: 'publish',
    description: row.description ?? undefined,
    scopeType: row.scopeType as 'system' | 'tenant',
    tenantId: row.tenantId ?? undefined,
    status: row.status,
    version: row.version,
    isLatest: true,
    isSystemPreset: row.scopeType === 'system',
    supportedProjectTypeId: row.supportedProjectTypeId ?? '',
    supportedGoalTypeIds: parseJsonArray(row.supportedGoalTypeIds),
    supportedDeliverableModes: parseJsonArray(row.supportedDeliverableModes),
    planningMode: 'manual' as const,
    nodeCount: row.nodeCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

// ─── Template CRUD ───────────────────────────────────────────────────────────

export async function dbListWorkflowTemplates(params: {
  tenantId?: string
  scopeType?: string
  status?: string
  page?: number
  pageSize?: number
  keyword?: string
}) {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const skip = (page - 1) * pageSize
  const where: Record<string, unknown> = {}
  if (params.tenantId) {
    where.OR = [
      { scopeType: 'system' },
      { tenantId: params.tenantId },
    ] as unknown[]
  }
  if (params.scopeType) where.scopeType = params.scopeType
  if (params.status) where.status = params.status
  if (params.keyword?.trim()) {
    where.AND = [
      {
        OR: [
          { name: { contains: params.keyword } },
          { code: { contains: params.keyword } },
          { description: { contains: params.keyword } },
        ],
      },
    ] as unknown[]
  }
  const [items, total] = await Promise.all([
    prisma.workflowTemplate.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.workflowTemplate.count({ where }),
  ])
  return {
    items: items.map(rowToTemplate),
    total,
  }
}

export async function dbGetWorkflowTemplateById(id: string) {
  const row = await prisma.workflowTemplate.findUnique({ where: { id } })
  return row ? rowToTemplate(row) : null
}

export async function dbCreateWorkflowTemplate(payload: {
  scopeType: string
  tenantId?: string
  name: string
  code?: string
  description?: string
  status?: string
  supportedProjectTypeId?: string
  supportedGoalTypeIds?: string[]
  supportedDeliverableModes?: string[]
}) {
  const ts = now()
  const row = await prisma.workflowTemplate.create({
    data: {
      scopeType: payload.scopeType,
      tenantId: payload.tenantId ?? null,
      name: payload.name,
      code: payload.code ?? null,
      description: payload.description ?? null,
      status: payload.status ?? 'draft',
      version: 1,
      nodeCount: 0,
      supportedProjectTypeId: payload.supportedProjectTypeId ?? null,
      supportedGoalTypeIds: payload.supportedGoalTypeIds
        ? JSON.stringify(payload.supportedGoalTypeIds)
        : null,
      supportedDeliverableModes: payload.supportedDeliverableModes
        ? JSON.stringify(payload.supportedDeliverableModes)
        : null,
      createdAt: ts,
      updatedAt: ts,
    },
  })
  return rowToTemplate(row)
}

export async function dbUpdateWorkflowTemplate(
  id: string,
  payload: Record<string, unknown>
) {
  const ts = now()
  const data: Record<string, unknown> = { updatedAt: ts }
  if (payload.name !== undefined) data.name = payload.name as string
  if (payload.code !== undefined) data.code = payload.code as string | null
  if (payload.description !== undefined) data.description = payload.description as string | null
  if (payload.status !== undefined) data.status = payload.status as string
  if (payload.supportedProjectTypeId !== undefined)
    data.supportedProjectTypeId = payload.supportedProjectTypeId as string | null
  if (payload.supportedGoalTypeIds !== undefined)
    data.supportedGoalTypeIds = JSON.stringify(payload.supportedGoalTypeIds)
  if (payload.supportedDeliverableModes !== undefined)
    data.supportedDeliverableModes = JSON.stringify(payload.supportedDeliverableModes)
  if (payload.nodeCount !== undefined) data.nodeCount = payload.nodeCount as number
  await prisma.workflowTemplate.update({
    where: { id },
    data: data as Record<string, string | number | null>,
  })
  return dbGetWorkflowTemplateById(id)
}

export async function dbDeleteWorkflowTemplate(id: string) {
  await prisma.workflowTemplateNode.deleteMany({ where: { workflowTemplateId: id } })
  await prisma.workflowTemplate.delete({ where: { id } })
  return { success: true }
}

export async function dbCloneWorkflowTemplateToTenant(
  sourceId: string,
  tenantId: string
) {
  const source = await dbGetWorkflowTemplateById(sourceId)
  if (!source) return null
  const created = await dbCreateWorkflowTemplate({
    scopeType: 'tenant',
    tenantId,
    name: `${source.name}-租户版`,
    code: `${(source.code || source.id).slice(0, 30)}_T`,
    description: source.description,
    status: 'draft',
    supportedProjectTypeId: source.supportedProjectTypeId,
    supportedGoalTypeIds: source.supportedGoalTypeIds,
    supportedDeliverableModes: source.supportedDeliverableModes,
  })
  const nodes = await prisma.workflowTemplateNode.findMany({
    where: { workflowTemplateId: sourceId },
    orderBy: { orderIndex: 'asc' },
  })
  for (const n of nodes) {
    await prisma.workflowTemplateNode.create({
      data: {
        workflowTemplateId: created.id,
        key: n.key,
        name: n.name,
        description: n.description ?? null,
        executionType: n.executionType,
        intentType: n.intentType,
        orderIndex: n.orderIndex,
        dependsOnNodeIds: n.dependsOnNodeIds,
        recommendedAgentTemplateId: n.recommendedAgentTemplateId,
        allowedSkillIds: n.allowedSkillIds,
        allowedTerminalTypes: n.allowedTerminalTypes,
        createdAt: now(),
        updatedAt: now(),
      },
    })
  }
  const count = nodes.length
  await prisma.workflowTemplate.update({
    where: { id: created.id },
    data: { nodeCount: count, updatedAt: now() },
  })
  return dbGetWorkflowTemplateById(created.id)
}

// ─── Node：DB row → 前端兼容形状 ─────────────────────────────────────────────

function parseJsonObject(s: string | null): Record<string, unknown> | undefined {
  if (!s) return undefined
  try {
    const o = JSON.parse(s)
    return typeof o === 'object' && o !== null ? o : undefined
  } catch {
    return undefined
  }
}

function rowToNode(row: {
  id: string
  workflowTemplateId: string
  key: string
  name: string
  description: string | null
  executionType: string
  intentType: string
  orderIndex: number
  dependsOnNodeIds: string | null
  recommendedAgentTemplateId: string | null
  allowedSkillIds: string | null
  allowedTerminalTypes: string | null
  allowedAgentRoleTypes?: string | null
  inputMapping?: string | null
  outputMapping?: string | null
  reviewPolicy?: string | null
  retryPolicy?: string | null
  fallbackAgentTemplateIds?: string | null
  fallbackSkillIds?: string | null
  supervisorPolicy?: string | null
  bindingStatus?: string | null
  placeholderSpec?: string | null
  position?: string | null
  createdAt: string
  updatedAt: string
}) {
  const dependsOn = parseJsonArray(row.dependsOnNodeIds)
  const allowedSkills = parseJsonArray(row.allowedSkillIds)
  const allowedTerminals = parseJsonArray(row.allowedTerminalTypes)
  const allowedRoles = parseJsonArray(row.allowedAgentRoleTypes ?? null)
  const fallbackAgents = parseJsonArray(row.fallbackAgentTemplateIds ?? null)
  const fallbackSkills = parseJsonArray(row.fallbackSkillIds ?? null)
  const position = row.position ? parseJsonObject(row.position) as { x: number; y: number } | undefined : undefined
  return {
    id: row.id,
    workflowTemplateId: row.workflowTemplateId,
    templateId: row.workflowTemplateId,
    key: row.key,
    nodeKey: row.key,
    name: row.name,
    nodeName: row.name,
    description: row.description ?? undefined,
    executionType: row.executionType,
    intentType: row.intentType,
    orderIndex: row.orderIndex,
    dependsOnNodeIds: dependsOn,
    recommendedAgentTemplateId: row.recommendedAgentTemplateId ?? undefined,
    allowedSkillIds: allowedSkills.length ? allowedSkills : undefined,
    allowedTerminalTypes: allowedTerminals.length ? allowedTerminals : undefined,
    allowedAgentRoleTypes: allowedRoles.length ? allowedRoles : undefined,
    inputMapping: parseJsonObject(row.inputMapping ?? null),
    outputMapping: parseJsonObject(row.outputMapping ?? null),
    reviewPolicy: parseJsonObject(row.reviewPolicy ?? null),
    retryPolicy: parseJsonObject(row.retryPolicy ?? null) as Record<string, unknown> | undefined,
    fallbackAgentTemplateIds: fallbackAgents.length ? fallbackAgents : undefined,
    fallbackSkillIds: fallbackSkills.length ? fallbackSkills : undefined,
    supervisorPolicy: parseJsonObject(row.supervisorPolicy ?? null) as Record<string, unknown> | undefined,
    bindingStatus: (row.bindingStatus as 'ready' | 'placeholder' | 'missing') ?? undefined,
    placeholderSpec: parseJsonObject(row.placeholderSpec ?? null) as Record<string, unknown> | undefined,
    position,
    status: 'enabled' as const,
    isOptional: false,
    onFailureStrategy: 'manual_retry' as const,
    nodeType: 'agent' as const,
    executorType: 'agent' as const,
    needReview: false,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function dbListTemplateNodes(workflowTemplateId: string) {
  const rows = await prisma.workflowTemplateNode.findMany({
    where: { workflowTemplateId },
    orderBy: { orderIndex: 'asc' },
  })
  return rows.map(rowToNode)
}

export async function dbGetTemplateNodeById(id: string) {
  const row = await prisma.workflowTemplateNode.findUnique({ where: { id } })
  return row ? rowToNode(row) : null
}

export async function dbCreateTemplateNode(
  workflowTemplateId: string,
  payload: {
    key: string
    name: string
    description?: string
    executionType?: string
    intentType?: string
    orderIndex?: number
    dependsOnNodeIds?: string[]
    recommendedAgentTemplateId?: string
    allowedSkillIds?: string[]
    allowedTerminalTypes?: string[]
  }
) {
  const ts = now()
  const maxOrder = await prisma.workflowTemplateNode
    .aggregate({
      where: { workflowTemplateId },
      _max: { orderIndex: true },
    })
    .then((r) => r._max.orderIndex ?? 0)
  const row = await prisma.workflowTemplateNode.create({
    data: {
      workflowTemplateId,
      key: payload.key,
      name: payload.name,
      description: payload.description ?? null,
      executionType: payload.executionType ?? 'agent_task',
      intentType: payload.intentType ?? 'create',
      orderIndex: payload.orderIndex ?? maxOrder + 1,
      dependsOnNodeIds: payload.dependsOnNodeIds
        ? JSON.stringify(payload.dependsOnNodeIds)
        : null,
      recommendedAgentTemplateId: payload.recommendedAgentTemplateId ?? null,
      allowedSkillIds: payload.allowedSkillIds
        ? JSON.stringify(payload.allowedSkillIds)
        : null,
      allowedTerminalTypes: payload.allowedTerminalTypes
        ? JSON.stringify(payload.allowedTerminalTypes)
        : null,
      createdAt: ts,
      updatedAt: ts,
    },
  })
  await prisma.workflowTemplate.update({
    where: { id: workflowTemplateId },
    data: { nodeCount: { increment: 1 }, updatedAt: ts },
  })
  return rowToNode(row)
}

export async function dbUpdateTemplateNode(
  id: string,
  payload: Record<string, unknown>
) {
  const ts = now()
  const data: Record<string, unknown> = { updatedAt: ts }
  if (payload.key !== undefined) data.key = payload.key as string
  if (payload.name !== undefined) data.name = payload.name as string
  if (payload.description !== undefined) data.description = payload.description as string | null
  if (payload.executionType !== undefined) data.executionType = payload.executionType as string
  if (payload.intentType !== undefined) data.intentType = payload.intentType as string
  if (payload.orderIndex !== undefined) data.orderIndex = payload.orderIndex as number
  if (payload.dependsOnNodeIds !== undefined)
    data.dependsOnNodeIds = JSON.stringify(payload.dependsOnNodeIds)
  if (payload.recommendedAgentTemplateId !== undefined)
    data.recommendedAgentTemplateId = payload.recommendedAgentTemplateId as string | null
  if (payload.allowedSkillIds !== undefined)
    data.allowedSkillIds = JSON.stringify(payload.allowedSkillIds)
  if (payload.allowedTerminalTypes !== undefined)
    data.allowedTerminalTypes = JSON.stringify(payload.allowedTerminalTypes)
  if (payload.allowedAgentRoleTypes !== undefined)
    data.allowedAgentRoleTypes = JSON.stringify(payload.allowedAgentRoleTypes)
  if (payload.inputMapping !== undefined)
    data.inputMapping = JSON.stringify(payload.inputMapping)
  if (payload.outputMapping !== undefined)
    data.outputMapping = JSON.stringify(payload.outputMapping)
  if (payload.reviewPolicy !== undefined)
    data.reviewPolicy = JSON.stringify(payload.reviewPolicy)
  if (payload.retryPolicy !== undefined)
    data.retryPolicy = JSON.stringify(payload.retryPolicy)
  if (payload.fallbackAgentTemplateIds !== undefined)
    data.fallbackAgentTemplateIds = JSON.stringify(payload.fallbackAgentTemplateIds)
  if (payload.fallbackSkillIds !== undefined)
    data.fallbackSkillIds = JSON.stringify(payload.fallbackSkillIds)
  if (payload.supervisorPolicy !== undefined)
    data.supervisorPolicy = JSON.stringify(payload.supervisorPolicy)
  if (payload.bindingStatus !== undefined)
    data.bindingStatus = payload.bindingStatus as string | null
  if (payload.placeholderSpec !== undefined)
    data.placeholderSpec = JSON.stringify(payload.placeholderSpec)
  if (payload.position !== undefined)
    data.position = JSON.stringify(payload.position)
  const row = await prisma.workflowTemplateNode.update({
    where: { id },
    data: data as Record<string, string | number | null>,
  })
  return rowToNode(row)
}

export async function dbDeleteTemplateNode(id: string) {
  const node = await prisma.workflowTemplateNode.findUnique({ where: { id } })
  if (!node) return false
  await prisma.workflowTemplateNode.delete({ where: { id } })
  const ts = now()
  await prisma.workflowTemplate.update({
    where: { id: node.workflowTemplateId },
    data: { nodeCount: { decrement: 1 }, updatedAt: ts },
  })
  return true
}

export async function dbReorderTemplateNodes(
  workflowTemplateId: string,
  orderedNodeIds: string[]
) {
  const ts = now()
  for (let i = 0; i < orderedNodeIds.length; i++) {
    await prisma.workflowTemplateNode.update({
      where: { id: orderedNodeIds[i] },
      data: { orderIndex: i, updatedAt: ts },
    })
  }
  return dbListTemplateNodes(workflowTemplateId)
}

/** 列出引用指定 Agent 的流程模板节点（用于 Agent 引用关系展示） */
export async function dbListTemplateNodesReferencingAgent(agentTemplateId: string) {
  const nodes = await prisma.workflowTemplateNode.findMany({
    where: { recommendedAgentTemplateId: agentTemplateId },
    include: { template: { select: { id: true, name: true } } },
    orderBy: [{ workflowTemplateId: 'asc' }, { orderIndex: 'asc' }],
  })
  return nodes.map((n) => ({
    nodeId: n.id,
    nodeKey: n.key,
    nodeName: n.name,
    templateId: n.workflowTemplateId,
    templateName: n.template.name,
  }))
}
