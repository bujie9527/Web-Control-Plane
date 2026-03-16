/**
 * 项目 / 目标 / SOP - 服务端持久化（批次 2）
 */
import { prisma } from './prismaClient'

const now = (): string => new Date().toISOString().slice(0, 19).replace('T', ' ')

// ─── Project ─────────────────────────────────────────────────────────────────

export async function dbListProjects(params: {
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
  tenantId?: string
}) {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 10
  const skip = (page - 1) * pageSize
  const where: Record<string, unknown> = {}
  if (params.tenantId) where.tenantId = params.tenantId
  if (params.status) where.status = params.status
  if (params.keyword?.trim()) {
    const kw = params.keyword.trim()
    where.OR = [
      { name: { contains: kw } },
      { description: { contains: kw } },
    ] as unknown[]
  }
  const [items, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.project.count({ where }),
  ])
  return {
    items: items.map(rowToProject),
    total,
  }
}

export async function dbGetProjectById(id: string) {
  const row = await prisma.project.findUnique({
    where: { id },
    include: { goals: true, sops: true },
  })
  return row ? rowToProject(row) : null
}

export async function dbCreateProject(payload: {
  tenantId: string
  name: string
  description?: string
  status?: string
  ownerId: string
  projectTypeCode?: string
  goalSummary?: string
  kpiSummary?: string
  allowedAgentTemplateIds?: string[]
  preferredAgentTemplateIds?: string[]
  defaultPlannerAgentTemplateId?: string
  selectedWorkflowTemplateId?: string
}) {
  const ts = now()
  const row = await prisma.project.create({
    data: {
      tenantId: payload.tenantId,
      name: payload.name,
      description: payload.description ?? null,
      status: payload.status ?? 'draft',
      ownerId: payload.ownerId,
      projectTypeCode: payload.projectTypeCode ?? null,
      goalSummary: payload.goalSummary ?? null,
      kpiSummary: payload.kpiSummary ?? null,
      allowedAgentTemplateIds: payload.allowedAgentTemplateIds
        ? JSON.stringify(payload.allowedAgentTemplateIds)
        : null,
      preferredAgentTemplateIds: payload.preferredAgentTemplateIds
        ? JSON.stringify(payload.preferredAgentTemplateIds)
        : null,
      defaultPlannerAgentTemplateId: payload.defaultPlannerAgentTemplateId ?? null,
      selectedWorkflowTemplateId: payload.selectedWorkflowTemplateId ?? null,
      createdAt: ts,
      updatedAt: ts,
    },
  })
  return rowToProject(row)
}

export async function dbUpdateProject(
  id: string,
  payload: Partial<{
    name: string
    description: string
    status: string
    goalSummary: string
    kpiSummary: string
    allowedAgentTemplateIds: string[]
    preferredAgentTemplateIds: string[]
    defaultPlannerAgentTemplateId: string
    selectedWorkflowTemplateId: string
  }>
) {
  const ts = now()
  const data: Record<string, unknown> = { updatedAt: ts }
  if (payload.name !== undefined) data.name = payload.name
  if (payload.description !== undefined) data.description = payload.description
  if (payload.status !== undefined) data.status = payload.status
  if (payload.goalSummary !== undefined) data.goalSummary = payload.goalSummary
  if (payload.kpiSummary !== undefined) data.kpiSummary = payload.kpiSummary
  if (payload.allowedAgentTemplateIds !== undefined)
    data.allowedAgentTemplateIds = JSON.stringify(payload.allowedAgentTemplateIds)
  if (payload.preferredAgentTemplateIds !== undefined)
    data.preferredAgentTemplateIds = JSON.stringify(payload.preferredAgentTemplateIds)
  if (payload.defaultPlannerAgentTemplateId !== undefined)
    data.defaultPlannerAgentTemplateId = payload.defaultPlannerAgentTemplateId
  if (payload.selectedWorkflowTemplateId !== undefined)
    data.selectedWorkflowTemplateId = payload.selectedWorkflowTemplateId
  const row = await prisma.project.update({
    where: { id },
    data: data as Record<string, string | null>,
  })
  return rowToProject(row)
}

export async function dbDeleteProject(id: string) {
  await prisma.project.delete({ where: { id } })
  return true
}

export async function dbPatchProjectStatus(id: string, status: string) {
  const row = await prisma.project.update({
    where: { id },
    data: { status, updatedAt: now() },
  })
  return rowToProject(row)
}

function rowToProject(row: {
  id: string
  tenantId: string
  name: string
  description: string | null
  status: string
  ownerId: string
  projectTypeCode: string | null
  goalSummary: string | null
  kpiSummary: string | null
  allowedAgentTemplateIds: string | null
  preferredAgentTemplateIds: string | null
  defaultPlannerAgentTemplateId: string | null
  defaultSupervisorAgentTemplateId: string | null
  selectedWorkflowTemplateId: string | null
  createdAt: string
  updatedAt: string
}) {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    description: row.description ?? undefined,
    status: row.status,
    ownerId: row.ownerId,
    projectTypeCode: row.projectTypeCode ?? undefined,
    goalSummary: row.goalSummary ?? undefined,
    kpiSummary: row.kpiSummary ?? undefined,
    allowedAgentTemplateIds: row.allowedAgentTemplateIds
      ? (JSON.parse(row.allowedAgentTemplateIds) as string[])
      : undefined,
    preferredAgentTemplateIds: row.preferredAgentTemplateIds
      ? (JSON.parse(row.preferredAgentTemplateIds) as string[])
      : undefined,
    defaultPlannerAgentTemplateId: row.defaultPlannerAgentTemplateId ?? undefined,
    defaultSupervisorAgentTemplateId: row.defaultSupervisorAgentTemplateId ?? undefined,
    selectedWorkflowTemplateId: row.selectedWorkflowTemplateId ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

// ─── ProjectGoal ─────────────────────────────────────────────────────────────

export async function dbCreateGoal(projectId: string, payload: {
  goalType: string
  goalName: string
  goalDescription: string
  successCriteria?: string
  kpiDefinition?: string
  goalTypeCode?: string
  primaryMetricCode?: string
  secondaryMetricCodes?: string[]
}) {
  const ts = now()
  const row = await prisma.projectGoal.create({
    data: {
      projectId,
      goalType: payload.goalType,
      goalName: payload.goalName,
      goalDescription: payload.goalDescription,
      successCriteria: payload.successCriteria ?? null,
      kpiDefinition: payload.kpiDefinition ?? null,
      isLocked: false,
      goalTypeCode: payload.goalTypeCode ?? null,
      primaryMetricCode: payload.primaryMetricCode ?? null,
      secondaryMetricCodes: payload.secondaryMetricCodes
        ? JSON.stringify(payload.secondaryMetricCodes)
        : null,
      createdAt: ts,
      updatedAt: ts,
    },
  })
  return {
    id: row.id,
    projectId: row.projectId,
    goalType: row.goalType,
    goalName: row.goalName,
    goalDescription: row.goalDescription,
    successCriteria: row.successCriteria ?? undefined,
    kpiDefinition: row.kpiDefinition ?? undefined,
    isLocked: row.isLocked,
    goalTypeCode: row.goalTypeCode ?? undefined,
    primaryMetricCode: row.primaryMetricCode ?? undefined,
    secondaryMetricCodes: row.secondaryMetricCodes
      ? (JSON.parse(row.secondaryMetricCodes) as string[])
      : undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function dbGetGoalsByProjectId(projectId: string) {
  const rows = await prisma.projectGoal.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
  })
  return rows.map((row) => ({
    id: row.id,
    projectId: row.projectId,
    goalType: row.goalType,
    goalName: row.goalName,
    goalDescription: row.goalDescription,
    successCriteria: row.successCriteria ?? undefined,
    kpiDefinition: row.kpiDefinition ?? undefined,
    isLocked: row.isLocked,
    goalTypeCode: row.goalTypeCode ?? undefined,
    primaryMetricCode: row.primaryMetricCode ?? undefined,
    secondaryMetricCodes: row.secondaryMetricCodes
      ? (JSON.parse(row.secondaryMetricCodes) as string[])
      : undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }))
}

// ─── ProjectSOP ─────────────────────────────────────────────────────────────

export async function dbGetSOPByProjectId(projectId: string) {
  const row = await prisma.projectSOP.findFirst({
    where: { projectId },
    orderBy: { updatedAt: 'desc' },
  })
  if (!row) return null
  return {
    id: row.id,
    projectId: row.projectId,
    sopRaw: row.sopRaw,
    sopParsed: row.sopParsed ? (JSON.parse(row.sopParsed) as Record<string, unknown>) : null,
    status: row.status,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function dbUpdateProjectSOP(projectId: string, payload: { sopRaw: string }) {
  const ts = now()
  const existing = await prisma.projectSOP.findFirst({
    where: { projectId },
    orderBy: { updatedAt: 'desc' },
  })
  if (existing) {
    const row = await prisma.projectSOP.update({
      where: { id: existing.id },
      data: { sopRaw: payload.sopRaw, updatedAt: ts },
    })
    return {
      id: row.id,
      projectId: row.projectId,
      sopRaw: row.sopRaw,
      sopParsed: row.sopParsed ? (JSON.parse(row.sopParsed) as Record<string, unknown>) : null,
      status: row.status,
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }
  const row = await prisma.projectSOP.create({
    data: {
      projectId,
      sopRaw: payload.sopRaw,
      status: 'active',
      version: '1.0',
      createdAt: ts,
      updatedAt: ts,
    },
  })
  return {
    id: row.id,
    projectId: row.projectId,
    sopRaw: row.sopRaw,
    sopParsed: null,
    status: row.status,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}
