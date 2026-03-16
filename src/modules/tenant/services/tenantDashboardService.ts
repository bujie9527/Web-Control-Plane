import type { TenantDashboardData } from '../schemas/tenantDashboard'
import * as statsRepo from '../repositories/statsRepository'

export async function getTenantDashboardData(
  tenantId: string
): Promise<TenantDashboardData> {
  const res = await statsRepo.fetchTenantDashboardStats(tenantId)
  const stats = res.code === 0 && res.data ? res.data : null
  const metricCards = stats
    ? [
        { key: 'runningProjects', value: stats.projectCount, label: '项目数' },
        { key: 'todoCount', value: stats.taskCount, label: '任务数' },
        { key: 'pendingReview', value: stats.instanceCount, label: '流程实例数' },
        { key: 'weekDone', value: stats.identityCount, label: '身份数' },
        { key: 'terminalCount', value: stats.terminalCount, label: '终端数' },
      ]
    : [
        { key: 'runningProjects', value: 0, label: '项目数' },
        { key: 'todoCount', value: 0, label: '任务数' },
        { key: 'pendingReview', value: 0, label: '流程实例数' },
        { key: 'weekDone', value: 0, label: '身份数' },
        { key: 'terminalCount', value: 0, label: '终端数' },
      ]
  return {
    metricCards,
    todoItems: [],
    alerts: [],
    recentTasks: [],
    quickEntries: [
      { key: 'newProject', label: '新建项目', path: '/tenant/projects' },
      { key: 'tasks', label: '任务中心', path: '/tenant/tasks' },
      { key: 'workflows', label: '流程中心', path: '/tenant/workflows' },
      { key: 'agents', label: 'Agent 中心', path: '/tenant/agents' },
      { key: 'skills', label: 'Skills 能力库', path: '/tenant/skills' },
      { key: 'terminals', label: '终端中心', path: '/tenant/terminals' },
    ],
  }
}
