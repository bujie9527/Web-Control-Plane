import * as statsRepo from '../repositories/statsRepository'
import type { TaskItem } from '../schemas/projectDetail'

export interface TaskCenterSummary {
  running: number
  review: number
  failed: number
  done: number
}

/** 租户任务列表（从各项目聚合的 TaskItem，增加 projectName 便于展示） */
export interface TaskCenterItem extends TaskItem {
  projectName?: string
}

export async function getTaskCenterData(tenantId: string): Promise<{
  summary: TaskCenterSummary
  runningTasks: TaskCenterItem[]
  reviewTasks: TaskCenterItem[]
  failedTasks: TaskCenterItem[]
  doneTasks: TaskCenterItem[]
}> {
  const res = await statsRepo.fetchTaskCenterData(tenantId)
  if (res.code !== 0) {
    return {
      summary: { running: 0, review: 0, failed: 0, done: 0 },
      runningTasks: [],
      reviewTasks: [],
      failedTasks: [],
      doneTasks: [],
    }
  }
  const d = res.data
  return {
    summary: d.summary,
    runningTasks: d.runningTasks as TaskCenterItem[],
    reviewTasks: d.reviewTasks as TaskCenterItem[],
    failedTasks: d.failedTasks as TaskCenterItem[],
    doneTasks: d.doneTasks as TaskCenterItem[],
  }
}
