/**
 * 统计聚合 domain：租户工作台、任务中心、平台工作台
 */
import { prisma } from './prismaClient'

export interface TenantDashboardStats {
  projectCount: number
  taskCount: number
  instanceCount: number
  identityCount: number
  terminalCount: number
}

export async function dbGetTenantDashboardStats(
  tenantId: string
): Promise<TenantDashboardStats> {
  const [projectCount, taskCount, identityCount, terminalCount] = await Promise.all([
    prisma.project.count({ where: { tenantId } }),
    prisma.task.count({ where: { project: { tenantId } } }),
    prisma.identity.count({ where: { tenantId } }),
    prisma.terminal.count({ where: { tenantId } }),
  ])
  const instanceCount = await prisma.workflowInstance.count({
    where: { project: { tenantId } },
  })
  return {
    projectCount,
    taskCount,
    instanceCount,
    identityCount,
    terminalCount,
  }
}

export interface TaskCenterStats {
  total: number
  pending: number
  running: number
  completed: number
  failed: number
}

export async function dbGetTaskCenterStats(
  tenantId: string
): Promise<TaskCenterStats> {
  const [total, pending, running, completed, failed] = await Promise.all([
    prisma.task.count({ where: { project: { tenantId } } }),
    prisma.task.count({ where: { project: { tenantId }, status: 'pending' } }),
    prisma.task.count({ where: { project: { tenantId }, status: 'running' } }),
    prisma.task.count({ where: { project: { tenantId }, status: 'completed' } }),
    prisma.task.count({ where: { project: { tenantId }, status: 'failed' } }),
  ])
  return { total, pending, running, completed, failed }
}

export interface PlatformDashboardStats {
  tenantCount: number
  projectCount: number
  agentCount: number
  skillCount: number
}

export async function dbGetPlatformDashboardStats(): Promise<PlatformDashboardStats> {
  const [tenantCount, projectCount, agentCount, skillCount] = await Promise.all([
    prisma.tenant.count(),
    prisma.project.count(),
    prisma.agentTemplate.count(),
    prisma.skill.count(),
  ])
  return { tenantCount, projectCount, agentCount, skillCount }
}
