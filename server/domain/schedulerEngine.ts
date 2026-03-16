import {
  dbCreateScheduledTaskExecution,
  dbFinishScheduledTaskExecution,
  dbListDueScheduledTasks,
  dbPatchScheduledTaskStatus,
} from './schedulerDb'
import { dbCreateInstance } from './workflowInstanceDb'

let timer: NodeJS.Timeout | null = null
let running = false

async function dispatchTask(task: {
  id: string
  targetType: string
  targetRefId: string | null
  projectId: string | null
  payloadJson: string | null
}): Promise<{ success: boolean; resultSummary?: string; errorSummary?: string }> {
  if (task.targetType === 'workflow_instance') {
    if (!task.targetRefId || !task.projectId) {
      return { success: false, errorSummary: '缺少 workflowTemplateId 或 projectId' }
    }
    const instance = await dbCreateInstance({
      projectId: task.projectId,
      workflowTemplateId: task.targetRefId,
      status: 'pending',
    })
    return {
      success: true,
      resultSummary: `已触发流程实例 ${instance.id}`,
    }
  }
  if (task.targetType === 'skill_execution') {
    return { success: true, resultSummary: 'skill_execution 已触发（占位）' }
  }
  return { success: true, resultSummary: 'system 任务已触发（占位）' }
}

async function tick() {
  if (running) return
  running = true
  try {
    const due = await dbListDueScheduledTasks()
    for (const task of due) {
      const exec = await dbCreateScheduledTaskExecution({ taskId: task.id, triggerSource: 'scheduler' })
      try {
        const result = await dispatchTask(task)
        await dbFinishScheduledTaskExecution({
          executionId: exec.id,
          taskId: task.id,
          success: result.success,
          resultSummary: result.resultSummary,
          errorSummary: result.errorSummary,
        })
      } catch (e) {
        await dbFinishScheduledTaskExecution({
          executionId: exec.id,
          taskId: task.id,
          success: false,
          errorSummary: e instanceof Error ? e.message : '调度执行异常',
        })
      }
    }
  } finally {
    running = false
  }
}

export function startSchedulerEngine(): void {
  if (timer) return
  timer = setInterval(() => {
    void tick()
  }, 30_000)
}

export function stopSchedulerEngine(): void {
  if (!timer) return
  clearInterval(timer)
  timer = null
}

export function getSchedulerState() {
  return { started: Boolean(timer), running }
}

export async function runScheduledTaskNow(taskId: string) {
  const exec = await dbCreateScheduledTaskExecution({ taskId, triggerSource: 'manual' })
  // 手动触发默认直接标记成功，避免阻塞管理端操作。
  await dbFinishScheduledTaskExecution({
    executionId: exec.id,
    taskId,
    success: true,
    resultSummary: '已手动触发',
  })
  await dbPatchScheduledTaskStatus(taskId, 'active')
  return exec
}

