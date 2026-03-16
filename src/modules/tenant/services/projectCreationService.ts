/**
 * 项目创建向导服务（Phase 18 — Deliverable / ResourceConfig / IdentityBinding 接入真实 API）
 *
 * 迁移说明：
 *   Before: Deliverable → projectDeliverableMock
 *           ResourceConfig → projectResourceConfigMock
 *           IdentityBinding → projectDetailMock.setProjectIdentityBinding
 *   After:  全部改为调用对应 Repository → 后端 API → Prisma
 */
import type { Project } from '../schemas/project'
import * as projectRepo from '../repositories/projectRepository'
import * as projectGoalRepo from '../repositories/projectGoalRepository'
import * as projectSOPRepo from '../repositories/projectSOPRepository'
import * as deliverableRepo from '../repositories/projectDeliverableRepository'
import * as resourceConfigRepo from '../repositories/projectResourceConfigRepository'
import * as identityBindingRepo from '../repositories/projectIdentityBindingRepository'
import type { ProjectDeliverableType, ProjectDeliverableFrequency } from '../schemas/projectSubdomain'

export interface CreateProjectFullContextPayload {
  tenantId: string
  name: string
  projectTypeCode: string
  description?: string
  ownerId: string
  ownerName?: string
  goal: {
    goalTypeCode: string
    goalName: string
    goalDescription: string
    successCriteria?: string
    kpiDefinition?: string
    primaryMetricCode: string
    secondaryMetricCodes: string[]
  }
  deliverable: {
    deliverableType: ProjectDeliverableType
    description: string
    frequency?: ProjectDeliverableFrequency
    target?: string
    notes?: string
  }
  /** 要绑定的身份 ID 列表 */
  identityIds: string[]
  defaultIdentityId?: string
  /** 要绑定的终端 ID 列表（写入 ResourceConfig，type='terminal'） */
  terminalIds: string[]
  /** 项目级 SOP */
  sopRaw?: string
  /** 选中的流程模板 ID */
  selectedWorkflowTemplateId?: string
  /** Agent 绑定（仅当有流程模板时） */
  nodeAgentBindings?: Array<{ templateNodeId: string; selectedAgentTemplateId: string }>
  /** Facebook 主页运营：主页与身份绑定（可选，当前阶段仅透传） */
  facebookPageBindings?: Array<{ pageId: string; pageName: string; credentialId: string; identityId: string }>
}

/**
 * 创建项目（含子域数据，全部写入真实 API）
 *
 * 顺序：1. 创建 Project  2. 创建 Goal  3. 创建 Deliverable
 *       4. 写 SOP       5. 批量绑定 Identity  6. 写入 Terminal ResourceConfig
 */
export async function createProjectWithFullContext(
  payload: CreateProjectFullContextPayload
): Promise<Project> {
  const {
    tenantId,
    name,
    projectTypeCode,
    description,
    ownerId,
    goal,
    deliverable,
    identityIds,
    defaultIdentityId,
    terminalIds,
    sopRaw,
    selectedWorkflowTemplateId,
  } = payload

  const goalSummary = goal.goalName
  const kpiSummary = goal.kpiDefinition ?? [goal.primaryMetricCode, ...(goal.secondaryMetricCodes ?? [])].filter(Boolean).join('、')

  const projectRes = await projectRepo.createProject({
    tenantId,
    name,
    projectTypeCode,
    description,
    status: 'draft',
    ownerId: ownerId ?? '',
    goalSummary,
    kpiSummary,
    selectedWorkflowTemplateId,
  })
  const project = projectRes.data

  await projectGoalRepo.fetchCreateGoal(project.id, {
    goalTypeCode: goal.goalTypeCode,
    goalName: goal.goalName,
    goalDescription: goal.goalDescription,
    successCriteria: goal.successCriteria,
    kpiDefinition: goal.kpiDefinition,
    primaryMetricCode: goal.primaryMetricCode,
    secondaryMetricCodes: goal.secondaryMetricCodes ?? [],
  })

  await deliverableRepo.createDeliverable(project.id, {
    deliverableType: deliverable.deliverableType,
    description: deliverable.description,
    frequency: deliverable.frequency,
    target: deliverable.target,
    notes: deliverable.notes,
  })

  if (sopRaw?.trim()) {
    await projectSOPRepo.fetchUpdateProjectSOP(project.id, { sopRaw: sopRaw.trim() })
  }

  for (const identityId of identityIds ?? []) {
    await identityBindingRepo.addProjectIdentityBinding(project.id, {
      identityId,
      isDefault: defaultIdentityId === identityId,
    })
  }
  if (defaultIdentityId && (identityIds ?? []).length > 0) {
    await identityBindingRepo.setDefaultProjectIdentityBinding(project.id, defaultIdentityId)
  }

  for (const terminalId of terminalIds ?? []) {
    await resourceConfigRepo.createResourceConfig(project.id, {
      configType: 'other',
      label: '绑定终端',
      value: terminalId,
    })
  }

  return project
}
