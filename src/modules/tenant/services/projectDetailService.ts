/**
 * 项目详情工作台服务（Phase 18 — 接入真实后端聚合接口）
 *
 * 调用链：
 *   fetchProjectDetailWorkbench → GET /api/projects/:id/workbench
 *                               → 映射为 ProjectDetailData 供页面使用
 */
import type { ProjectWorkbenchData } from '../schemas/projectSubdomain'
import type {
  ProjectDetailData,
  ProjectDetailSummary,
  RecentTaskItem,
  PhaseGoalItem,
  KpiDefinitionItem,
  ProjectIdentityBindingItem,
  WorkflowItem,
  TaskItem,
  TaskDetailView,
} from '../schemas/projectDetail'
import type { ProjectGoal, ProjectDeliverable, ProjectResourceConfig, ProjectSOP } from '../schemas/projectDomain'
import * as taskRepo from '../repositories/taskRepository'

const API_BASE = typeof window !== 'undefined' ? '' : 'http://localhost:3001'

async function requestWorkbench<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${url}`, { headers: { 'Content-Type': 'application/json' } })
    const json = (await res.json()) as { code: number; message?: string; data: T }
    if (!res.ok || json.code !== 0) return null
    return json.data
  } catch {
    return null
  }
}

/** 将工作台聚合数据映射为页面使用的 ProjectDetailData */
function mapWorkbenchToDetailData(w: ProjectWorkbenchData, projectId: string): ProjectDetailData {
  const p = w.project
  const defaultBinding = w.identityBindings.find((b) => b.isDefault)
  const summary: ProjectDetailSummary = {
    ...p,
    description: p.description ?? undefined,
    status: p.status as ProjectDetailSummary['status'],
    projectTypeCode: p.projectTypeCode ?? undefined,
    goalSummary: p.goalSummary ?? undefined,
    kpiSummary: p.kpiSummary ?? undefined,
    selectedWorkflowTemplateId: p.selectedWorkflowTemplateId ?? undefined,
    ownerId: '',
    identityCount: w.identityBindings.length,
    defaultIdentityName: defaultBinding?.identityName,
    identityPlatformSummary: w.identityBindings.length
      ? w.identityBindings.map((b) => b.identityName).join('、')
      : undefined,
  }
  const recentTasks: RecentTaskItem[] = w.recentTasks.map((t) => ({
    id: t.id,
    taskName: t.title,
    status: t.status,
    updatedAt: t.updatedAt,
  }))
  const phaseGoals: PhaseGoalItem[] = w.goals.map((g) => ({
    id: g.id,
    name: g.goalName,
    dateRange: '',
    description: g.successCriteria ?? '',
    status: g.isLocked ? 'locked' : 'active',
  }))
  const kpiDefinitions: KpiDefinitionItem[] = w.goals
    .filter((g) => g.kpiDefinition)
    .map((g, i) => ({
      id: `kpi-${g.id}-${i}`,
      name: g.goalName,
      target: g.kpiDefinition ?? '',
      current: '—',
      unit: '',
    }))
  const identitiesList: ProjectIdentityBindingItem[] = w.identityBindings.map((b) => ({
    identityId: b.identityId,
    name: b.identityName,
    type: b.identityType ?? '—',
    platformLabels: undefined,
    isDefault: b.isDefault,
  }))
  const workflows: WorkflowItem[] = w.recentInstances.map((i) => ({
    id: i.id,
    name: i.templateName ?? '—',
    version: '',
    status: i.status,
    lastRunAt: i.updatedAt,
  }))
  const taskSummary = { running: 0, review: 0, failed: 0, done: 0 }
  w.recentTasks.forEach((t) => {
    if (t.status === 'running' || t.status === 'pending') taskSummary.running++
    else if (t.status === 'waiting_review') taskSummary.review++
    else if (t.status === 'failed') taskSummary.failed++
    else taskSummary.done++
  })
  const recentTasksAsTaskItem: TaskItem[] = w.recentTasks.map((t) => ({
    id: t.id,
    taskName: t.title,
    workflowName: '—',
    status: t.status,
    assigneeName: '—',
    updatedAt: t.updatedAt,
    workflowInstanceId: t.workflowInstanceId ?? undefined,
  }))
  const projectGoals: ProjectGoal[] = w.goals.map((g) => ({
    id: g.id,
    projectId,
    goalType: (g.goalTypeCode as ProjectGoal['goalType']) ?? 'other',
    goalName: g.goalName,
    goalDescription: g.successCriteria ?? '',
    successCriteria: g.successCriteria ?? undefined,
    kpiDefinition: g.kpiDefinition ?? undefined,
    isLocked: g.isLocked,
    createdAt: g.createdAt,
    updatedAt: g.createdAt,
    goalTypeCode: g.goalTypeCode ?? undefined,
    primaryMetricCode: g.primaryMetricCode ?? undefined,
    secondaryMetricCodes: g.secondaryMetricCodes ?? [],
  }))
  const projectDeliverables: ProjectDeliverable[] = w.deliverables.map((d) => ({
    id: d.id,
    projectId,
    deliverableType: d.deliverableType as ProjectDeliverable['deliverableType'],
    deliverableName: d.description || d.deliverableType,
    description: d.description,
    frequency: d.frequency ?? undefined,
    targetValue: d.target ?? undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }))
  const projectResourceConfigs: ProjectResourceConfig[] = w.resourceConfigs.map((c) => ({
    id: c.id,
    projectId,
    resourceType: 'api',
    resourceId: c.id,
    resourceName: c.label,
    resourceSummary: c.value,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }))
  const projectSOP: ProjectSOP | null = w.sop
    ? {
        id: w.sop.id,
        projectId,
        sopRaw: w.sop.sopRaw,
        sopParsed:
          w.sop.sopParsed != null && typeof w.sop.sopParsed === 'object'
            ? (w.sop.sopParsed as Record<string, unknown>)
            : null,
        status: w.sop.status as ProjectSOP['status'],
        version: w.sop.version,
        createdAt: w.sop.updatedAt,
        updatedAt: w.sop.updatedAt,
      }
    : null

  return {
    summary,
    overview: { recentTasks, alerts: [] },
    goals: {
      goalDescription: p.goalSummary ?? undefined,
      phaseGoals,
      kpiDefinitions,
    },
    channels: { list: [] },
    agentTeam: { teamName: '', teamStatus: '—', roles: [] },
    identities: {
      list: identitiesList,
      defaultIdentityId: defaultBinding?.identityId,
    },
    terminals: { list: [] },
    workflowTasks: {
      workflows,
      recentTasks: recentTasksAsTaskItem,
      taskSummary,
    },
    results: { feeds: [], kpiAchievements: [] },
    settings: { members: [] },
    projectGoals,
    projectDeliverables,
    projectResourceConfigs,
    projectSOP,
  }
}

/**
 * 获取项目工作台聚合数据，并映射为页面使用的 ProjectDetailData
 */
export async function fetchProjectDetailWorkbench(
  projectId: string
): Promise<ProjectDetailData | null> {
  const raw = await requestWorkbench<ProjectWorkbenchData>(`/api/projects/${projectId}/workbench`)
  if (!raw) return null
  return mapWorkbenchToDetailData(raw, projectId)
}

/**
 * 获取任务详情（从 taskRepository 组装 TaskDetailView）
 */
export async function fetchTaskDetail(
  _projectId: string,
  taskId: string
): Promise<TaskDetailView | null> {
  try {
    const res = await taskRepo.fetchTaskById(taskId)
    if (res.code !== 0 || !res.data) return null
    const t = res.data
    const view: TaskDetailView = {
      id: t.id,
      taskName: t.title,
      workflowName: '—',
      status: t.status,
      assigneeName: '—',
      updatedAt: t.updatedAt,
      workflowInstanceId: t.workflowInstanceId,
      workflowNodeId: t.workflowInstanceNodeId,
    }
    return view
  } catch {
    return null
  }
}
