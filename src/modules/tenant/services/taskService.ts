/**
 * 任务服务（Phase 18 — identity 校验改为调真实 projectIdentityBindingRepository）
 */
import type { TaskItem } from '../schemas/projectDetail'
import type { CreateTaskPayload } from '../mock/taskMock'
import * as taskRepo from '../repositories/taskRepository'
import * as identityBindingRepo from '../repositories/projectIdentityBindingRepository'

export async function createTask(projectId: string, payload: CreateTaskPayload): Promise<TaskItem> {
  const bindingsRes = await identityBindingRepo.fetchProjectIdentityBindings(projectId)
  const bindings = bindingsRes.code === 0 ? (bindingsRes.data ?? []) : []
  const allowedIdentityIds = bindings.map((b) => b.identityId)
  if (allowedIdentityIds.length > 0 && !allowedIdentityIds.includes(payload.identityId)) {
    throw new Error('所选身份不在当前项目已绑定身份范围内')
  }

  const res = await taskRepo.fetchCreateTask({
    projectId,
    title: payload.taskName,
    workflowInstanceId: payload.workflowInstanceId,
    workflowInstanceNodeId: payload.workflowNodeId,
    status: 'pending',
  })
  if (res.code !== 0) throw new Error(res.message)
  const t = res.data
  return {
    id: t.id,
    taskName: payload.taskName,
    workflowName: payload.workflowName ?? '未指定流程',
    status: '待运行',
    assigneeName: payload.assigneeName ?? '—',
    updatedAt: t.updatedAt,
    identityId: payload.identityId,
    identityName: payload.assigneeName ?? '—',
    workflowTemplateId: payload.workflowTemplateId,
    workflowInstanceId: payload.workflowInstanceId ?? t.workflowInstanceId,
    workflowNodeId: payload.workflowNodeId ?? t.workflowInstanceNodeId,
    currentNodeKey: payload.currentNodeKey,
  }
}
