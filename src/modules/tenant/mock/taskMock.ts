/**
 * 任务 Mock：创建任务（带 Identity 校验）、已创建任务列表，与 projectDetailMock 配合使用
 */
import type { TaskItem } from '../schemas/projectDetail'
import { getIdentityById } from './identityMock'

/** 按项目缓存的「创建任务」产生的任务（仅 mock 内存） */
const createdTasksByProject: Record<string, TaskItem[]> = {
  p5: [
    {
      id: 'rt5',
      taskName: 'Facebook 闭环演示',
      workflowName: 'Facebook 社媒闭环',
      status: '运行中',
      assigneeName: '张三',
      updatedAt: '2025-03-08 11:00',
      identityId: 'id1',
      identityName: '品牌主账号',
      workflowTemplateId: 'wt-facebook',
      workflowInstanceId: 'wi5',
      currentNodeKey: 'create',
    },
  ],
}

function nextTaskId(projectId: string): string {
  const list = createdTasksByProject[projectId] ?? []
  const max = list.reduce((m, t) => {
    const n = t.id.replace(/^rt/, '')
    const num = parseInt(n, 10)
    return isNaN(num) ? m : Math.max(m, num)
  }, 0)
  return `rt${max + 10}`
}

export interface CreateTaskPayload {
  taskName: string
  workflowId?: string
  workflowName?: string
  identityId: string
  assigneeName?: string
  workflowTemplateId?: string
  workflowInstanceId?: string
  workflowNodeId?: string
  currentNodeKey?: string
}

/**
 * 创建任务。identityId 必须在 allowedIdentityIds 内（项目已绑定身份）。
 * 返回新任务项，并写入 createdTasksByProject 供 getProjectDetail 合并展示。
 */
export function createTask(
  projectId: string,
  payload: CreateTaskPayload,
  options?: { allowedIdentityIds?: string[] }
): TaskItem {
  const { allowedIdentityIds } = options ?? {}
  if (allowedIdentityIds && allowedIdentityIds.length > 0 && !allowedIdentityIds.includes(payload.identityId)) {
    throw new Error('所选身份不在当前项目已绑定身份范围内')
  }
  const identity = getIdentityById(payload.identityId)
  const identityName = identity?.name
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
  const task: TaskItem = {
    id: nextTaskId(projectId),
    taskName: payload.taskName,
    workflowName: payload.workflowName ?? '未指定流程',
    status: '待运行',
    assigneeName: payload.assigneeName ?? '—',
    updatedAt: now,
    identityId: payload.identityId,
    identityName: identityName ?? '—',
    workflowTemplateId: payload.workflowTemplateId,
    workflowInstanceId: payload.workflowInstanceId,
    workflowNodeId: payload.workflowNodeId,
    currentNodeKey: payload.currentNodeKey,
  }
  if (!createdTasksByProject[projectId]) createdTasksByProject[projectId] = []
  createdTasksByProject[projectId].push(task)
  return task
}

export function getCreatedTasksForProject(projectId: string): TaskItem[] {
  return createdTasksByProject[projectId] ?? []
}

/** 更新任务状态（用于执行页完成/审核后回写） */
export function updateTaskStatus(projectId: string, taskId: string, status: string): void {
  const list = createdTasksByProject[projectId]
  if (!list) return
  const task = list.find((t) => t.id === taskId)
  if (!task) return
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
  task.status = status
  task.updatedAt = now
}
