/**
 * 项目资源配置 Mock，按 projectId 维度
 * 风险规避：以 server/api/agentTeam 为主，少量 identity/terminal 示例，不与现有 identities/terminals 列表重复逻辑
 */
import type { ProjectResourceConfig, ProjectResourceType } from '../schemas/projectDomain'

const projectResourceConfigsByProject: Record<string, ProjectResourceConfig[]> = {
  p1: [
    {
      id: 'prc1-p1',
      projectId: 'p1',
      resourceType: 'agentTeam' as ProjectResourceType,
      resourceId: 'at1',
      resourceName: '内容运营组',
      resourceSummary: '负责撰写、审核与发布',
      status: '正常',
      createdAt: '2025-02-01',
      updatedAt: '2025-03-08',
    },
    {
      id: 'prc2-p1',
      projectId: 'p1',
      resourceType: 'api' as ProjectResourceType,
      resourceId: 'api-campaign',
      resourceName: '社媒数据接口',
      resourceSummary: '拉取各渠道曝光、互动数据',
      status: '正常',
      createdAt: '2025-02-05',
      updatedAt: '2025-03-08',
    },
    {
      id: 'prc3-p1',
      projectId: 'p1',
      resourceType: 'terminal' as ProjectResourceType,
      resourceId: 'term1',
      resourceName: 'FB 主账号',
      resourceSummary: '社媒发布终端',
      status: '正常',
      createdAt: '2025-02-01',
      updatedAt: '2025-03-08',
    },
  ],
  p2: [
    {
      id: 'prc1-p2',
      projectId: 'p2',
      resourceType: 'server' as ProjectResourceType,
      resourceId: 'srv-data',
      resourceName: '数据拉取服务',
      resourceSummary: '定时拉取多源数据',
      status: '正常',
      createdAt: '2025-01-15',
      updatedAt: '2025-03-08',
    },
    {
      id: 'prc2-p2',
      projectId: 'p2',
      resourceType: 'api' as ProjectResourceType,
      resourceId: 'api-dashboard',
      resourceName: '数据接口-日更',
      resourceSummary: '看板数据源',
      status: '正常',
      createdAt: '2025-01-15',
      updatedAt: '2025-03-08',
    },
  ],
  p3: [
    {
      id: 'prc1-p3',
      projectId: 'p3',
      resourceType: 'agentTeam' as ProjectResourceType,
      resourceId: 'at1',
      resourceName: '内容运营组',
      resourceSummary: '撰写与审核 Agent',
      status: '正常',
      createdAt: '2025-02-20',
      updatedAt: '2025-03-08',
    },
  ],
}

export function getResourceConfigsByProjectId(projectId: string): ProjectResourceConfig[] {
  return projectResourceConfigsByProject[projectId] ?? []
}

export interface CreateResourceConfigPayload {
  resourceType: ProjectResourceType
  resourceId: string
  resourceName: string
  resourceSummary?: string
}

export function createResourceConfig(
  projectId: string,
  payload: CreateResourceConfigPayload
): ProjectResourceConfig {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const id = `prc-${projectId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const config: ProjectResourceConfig = {
    id,
    projectId,
    resourceType: payload.resourceType,
    resourceId: payload.resourceId,
    resourceName: payload.resourceName,
    resourceSummary: payload.resourceSummary,
    status: '正常',
    createdAt: now,
    updatedAt: now,
  }
  if (!projectResourceConfigsByProject[projectId]) projectResourceConfigsByProject[projectId] = []
  projectResourceConfigsByProject[projectId].push(config)
  return config
}
