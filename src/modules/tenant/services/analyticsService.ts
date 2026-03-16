/**
 * 数据分析服务：聚合项目、任务等数据供分析页展示
 */
import { getTaskCenterData } from './taskCenterService'
import { getProjectList } from './projectService'
import type { ApiResponse } from '@/core/types/api'

export interface AnalyticsOverviewItem {
  key: string
  value: string
}

export interface AnalyticsProjectStat {
  name: string
  taskCount: number
  doneCount: number
}

export interface AnalyticsData {
  overview: AnalyticsOverviewItem[]
  projectStats: AnalyticsProjectStat[]
}

export async function getAnalyticsData(tenantId: string): Promise<AnalyticsData> {
  try {
    const res = await fetch(`/api/analytics/tenant/${encodeURIComponent(tenantId)}`)
    const json = (await res.json()) as ApiResponse<{
      overview: { projectCount: number; reportCount: number; incomingCount: number; outgoingCount: number }
    }>
    if (res.ok && json.code === 0 && json.data) {
      const overview: AnalyticsOverviewItem[] = [
        { key: '项目总数', value: String(json.data.overview.projectCount) },
        { key: '报告数量', value: String(json.data.overview.reportCount) },
        { key: '接入消息', value: String(json.data.overview.incomingCount) },
        { key: '发送消息', value: String(json.data.overview.outgoingCount) },
      ]
      return { overview, projectStats: [] }
    }
  } catch {
    // 降级到旧聚合逻辑
  }

  const [taskData, projectRes] = await Promise.all([
    getTaskCenterData(tenantId),
    getProjectList({ page: 1, pageSize: 100 }),
  ])
  const projects = projectRes.items.filter((p) => p.tenantId === tenantId)
  const projectStats: AnalyticsProjectStat[] = projects.map((p) => {
    const running = taskData.runningTasks.filter((t) => t.projectName === p.name).length
    const review = taskData.reviewTasks.filter((t) => t.projectName === p.name).length
    const failed = taskData.failedTasks.filter((t) => t.projectName === p.name).length
    const done = taskData.doneTasks.filter((t) => t.projectName === p.name).length
    const taskCount = running + review + failed + done
    return { name: p.name, taskCount, doneCount: done }
  })
  const overview: AnalyticsOverviewItem[] = [
    { key: '项目总数', value: String(projects.length) },
    { key: '运行中任务', value: String(taskData.summary.running) },
    { key: '待审核任务', value: String(taskData.summary.review) },
    { key: '异常任务', value: String(taskData.summary.failed) },
    { key: '本周已完成', value: String(taskData.summary.done) },
  ]
  return { overview, projectStats }
}
