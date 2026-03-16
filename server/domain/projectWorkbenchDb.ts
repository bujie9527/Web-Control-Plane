/**
 * 项目工作台聚合查询（后端聚合 — 前端单接口取全量）
 * GET /api/projects/:id/workbench → ProjectWorkbenchData
 *
 * 聚合来源：
 *   Project + ProjectGoal + ProjectSOP
 *   + ProjectIdentityBinding（含 Identity 名称/状态）
 *   + ProjectDeliverable
 *   + ProjectResourceConfig
 *   + Task（最近 5 条）
 *   + WorkflowInstance（最近 3 条，含节点进度）
 */
import { prisma } from './prismaClient'

// ─── 聚合结果类型 ─────────────────────────────────────────────────────────────

export interface WorkbenchIdentityBinding {
  id: string
  identityId: string
  identityName: string
  identityType?: string | null
  identityStatus: string
  isDefault: boolean
  createdAt: string
}

export interface WorkbenchRecentTask {
  id: string
  title: string
  status: string
  updatedAt: string
  workflowInstanceId?: string | null
}

export interface WorkbenchRecentInstance {
  id: string
  workflowTemplateId: string
  templateName?: string
  status: string
  nodeCount: number
  completedNodeCount: number
  createdAt: string
  updatedAt: string
}

export interface ProjectWorkbenchData {
  // 项目基础
  project: {
    id: string
    tenantId: string
    name: string
    description?: string | null
    status: string
    projectTypeCode?: string | null
    goalSummary?: string | null
    kpiSummary?: string | null
    allowedAgentTemplateIds: string[]
    preferredAgentTemplateIds: string[]
    selectedWorkflowTemplateId?: string | null
    createdAt: string
    updatedAt: string
  }
  // 目标列表
  goals: {
    id: string
    goalName: string
    goalType: string
    goalTypeCode?: string | null
    primaryMetricCode?: string | null
    secondaryMetricCodes: string[]
    successCriteria?: string | null
    kpiDefinition?: string | null
    isLocked: boolean
    createdAt: string
  }[]
  // SOP（最新一条）
  sop?: {
    id: string
    sopRaw: string
    sopParsed?: string | null
    status: string
    version: string
    updatedAt: string
  } | null
  // 身份绑定（含身份基础信息）
  identityBindings: WorkbenchIdentityBinding[]
  // 交付标的
  deliverables: {
    id: string
    deliverableType: string
    description: string
    frequency?: string | null
    target?: string | null
    notes?: string | null
  }[]
  // 资源配置
  resourceConfigs: {
    id: string
    configType: string
    label: string
    value: string
    notes?: string | null
  }[]
  // 最近任务（最多 10 条）
  recentTasks: WorkbenchRecentTask[]
  // 最近流程实例（最多 5 条）
  recentInstances: WorkbenchRecentInstance[]
}

function parseJsonArray(s: string | null): string[] {
  if (!s) return []
  try {
    const arr = JSON.parse(s) as unknown
    return Array.isArray(arr) ? (arr as string[]) : []
  } catch {
    return []
  }
}

export async function dbGetProjectWorkbench(
  projectId: string
): Promise<ProjectWorkbenchData | null> {
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) return null

  const [goals, sops, bindings, deliverables, resourceConfigs, tasks, instances] = await Promise.all([
    prisma.projectGoal.findMany({ where: { projectId }, orderBy: { createdAt: 'asc' } }),
    prisma.projectSOP.findMany({ where: { projectId }, orderBy: { updatedAt: 'desc' }, take: 1 }),
    prisma.projectIdentityBinding.findMany({ where: { projectId }, orderBy: { createdAt: 'asc' } }),
    prisma.projectDeliverable.findMany({ where: { projectId }, orderBy: { createdAt: 'asc' } }),
    prisma.projectResourceConfig.findMany({ where: { projectId }, orderBy: { createdAt: 'asc' } }),
    prisma.task.findMany({ where: { projectId }, orderBy: { updatedAt: 'desc' }, take: 10 }),
    prisma.workflowInstance.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: { nodes: true },
    }),
  ])

  const identityIds = [...new Set(bindings.map((b) => b.identityId))]
  const identities =
    identityIds.length > 0
      ? await prisma.identity.findMany({ where: { id: { in: identityIds } } })
      : []
  const identityMap = new Map(identities.map((i) => [i.id, i]))

  const templateIds = [...new Set(instances.map((i) => i.workflowTemplateId))]
  const templates =
    templateIds.length > 0
      ? await prisma.workflowTemplate.findMany({ where: { id: { in: templateIds } } })
      : []
  const templateMap = new Map(templates.map((t) => [t.id, t.name]))

  const identityBindings: WorkbenchIdentityBinding[] = bindings.map((b) => {
    const identity = identityMap.get(b.identityId)
    return {
      id: b.id,
      identityId: b.identityId,
      identityName: identity?.name ?? '',
      identityType: identity?.type ?? null,
      identityStatus: identity?.status ?? 'unknown',
      isDefault: b.isDefault,
      createdAt: b.createdAt,
    }
  })

  const recentInstances: WorkbenchRecentInstance[] = instances.map((inst) => {
    const completed = inst.nodes.filter((n) => n.status === 'completed').length
    return {
      id: inst.id,
      workflowTemplateId: inst.workflowTemplateId,
      templateName: templateMap.get(inst.workflowTemplateId),
      status: inst.status,
      nodeCount: inst.nodes.length,
      completedNodeCount: completed,
      createdAt: inst.createdAt,
      updatedAt: inst.updatedAt,
    }
  })

  return {
    project: {
      id: project.id,
      tenantId: project.tenantId,
      name: project.name,
      description: project.description ?? null,
      status: project.status,
      projectTypeCode: project.projectTypeCode ?? null,
      goalSummary: project.goalSummary ?? null,
      kpiSummary: project.kpiSummary ?? null,
      allowedAgentTemplateIds: parseJsonArray(project.allowedAgentTemplateIds),
      preferredAgentTemplateIds: parseJsonArray(project.preferredAgentTemplateIds),
      selectedWorkflowTemplateId: project.selectedWorkflowTemplateId ?? null,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    },
    goals: goals.map((g) => ({
      id: g.id,
      goalName: g.goalName,
      goalType: g.goalType,
      goalTypeCode: g.goalTypeCode ?? null,
      primaryMetricCode: g.primaryMetricCode ?? null,
      secondaryMetricCodes: parseJsonArray(g.secondaryMetricCodes),
      successCriteria: g.successCriteria ?? null,
      kpiDefinition: g.kpiDefinition ?? null,
      isLocked: g.isLocked,
      createdAt: g.createdAt,
    })),
    sop:
      sops.length > 0
        ? {
            id: sops[0].id,
            sopRaw: sops[0].sopRaw,
            sopParsed: sops[0].sopParsed ?? null,
            status: sops[0].status,
            version: sops[0].version,
            updatedAt: sops[0].updatedAt,
          }
        : null,
    identityBindings,
    deliverables: deliverables.map((d) => ({
      id: d.id,
      deliverableType: d.deliverableType,
      description: d.description,
      frequency: d.frequency ?? null,
      target: d.target ?? null,
      notes: d.notes ?? null,
    })),
    resourceConfigs: resourceConfigs.map((c) => ({
      id: c.id,
      configType: c.configType,
      label: c.label,
      value: c.value,
      notes: c.notes ?? null,
    })),
    recentTasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      updatedAt: t.updatedAt,
      workflowInstanceId: t.workflowInstanceId ?? null,
    })),
    recentInstances,
  }
}
