/**
 * 项目领域子对象服务：Goal / Deliverable / ResourceConfig / SOP
 * 对外统一入口，内部调 repository；API 返回 subdomain 形状，此处映射为 domain 形状
 */
import type {
  ProjectGoal,
  ProjectDeliverable,
  ProjectResourceConfig,
  ProjectSOP,
} from '../schemas/projectDomain'
import * as projectGoalRepo from '../repositories/projectGoalRepository'
import * as projectDeliverableRepo from '../repositories/projectDeliverableRepository'
import * as projectResourceConfigRepo from '../repositories/projectResourceConfigRepository'
import * as projectSOPRepo from '../repositories/projectSOPRepository'

export async function getGoals(projectId: string): Promise<ProjectGoal[]> {
  const res = await projectGoalRepo.fetchGoalsByProjectId(projectId)
  return res.data
}

export async function getDeliverables(projectId: string): Promise<ProjectDeliverable[]> {
  const res = await projectDeliverableRepo.fetchDeliverablesByProjectId(projectId)
  const list = res.data as Array<{ id: string; deliverableType: string; description: string; frequency?: string; target?: string; notes?: string; createdAt: string; updatedAt: string }>
  return list.map((d) => ({
    id: d.id,
    projectId,
    deliverableType: d.deliverableType as ProjectDeliverable['deliverableType'],
    deliverableName: d.description || d.deliverableType,
    description: d.description,
    frequency: d.frequency as ProjectDeliverable['frequency'],
    targetValue: d.target,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }))
}

export async function getResourceConfigs(projectId: string): Promise<ProjectResourceConfig[]> {
  const res = await projectResourceConfigRepo.fetchResourceConfigsByProjectId(projectId)
  const list = res.data as Array<{ id: string; configType: string; label: string; value: string; notes?: string; createdAt: string; updatedAt: string }>
  return list.map((c) => ({
    id: c.id,
    projectId,
    resourceType: 'api' as const,
    resourceId: c.id,
    resourceName: c.label,
    resourceSummary: c.value,
    status: 'active',
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }))
}

export async function getSOP(projectId: string): Promise<ProjectSOP | null> {
  const res = await projectSOPRepo.fetchSOPByProjectId(projectId)
  return res.data
}

export async function updateProjectSOP(
  projectId: string,
  payload: { sopRaw: string }
): Promise<ProjectSOP> {
  const res = await projectSOPRepo.fetchUpdateProjectSOP(projectId, payload)
  return res.data
}
