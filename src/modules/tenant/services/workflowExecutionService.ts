/**
 * Workflow & Task Execution 统一服务入口
 * 对外提供模板、实例、节点查询；创建流程实例与任务
 */
import type {
  WorkflowTemplate,
  WorkflowTemplateNode,
  WorkflowInstance,
  WorkflowInstanceNode,
  CreateWorkflowInstancePayload,
  WorkflowInstanceListItem,
} from '../schemas/workflowExecution'
import type { TaskItem, TaskDetailView } from '../schemas/projectDetail'
import * as projectRepo from '../repositories/projectRepository'
import * as templateRepo from '../repositories/workflowTemplateRepository'
import * as templateNodeRepo from '../repositories/workflowTemplateNodeRepository'
import * as instanceRepo from '../repositories/workflowInstanceRepository'
import * as instanceNodeRepo from '../repositories/workflowInstanceNodeRepository'
import * as taskRepo from '../repositories/taskRepository'
import * as taskService from './taskService'
import { fetchTaskDetail } from './projectDetailService'
import { executeWorkerNode } from './workerAgentExecutionService'

/** 任务执行详情页聚合数据 */
export interface TaskExecutionView {
  task: TaskDetailView
  instance: WorkflowInstance
  template: WorkflowTemplate | null
  nodes: WorkflowInstanceNode[]
  /** 模板节点（含 Agent 绑定），用于展示节点使用的模板 */
  templateNodes: WorkflowTemplateNode[]
  projectName: string
}

export async function getTemplates(tenantId: string): Promise<WorkflowTemplate[]> {
  const res = await templateRepo.fetchTemplateList(tenantId)
  return res.data
}

export async function getTemplateDetail(id: string): Promise<WorkflowTemplate | null> {
  const res = await templateRepo.fetchTemplateDetail(id)
  return res.data
}

export async function getTemplateNodes(templateId: string): Promise<WorkflowTemplateNode[]> {
  const res = await templateNodeRepo.fetchNodesByTemplateId(templateId)
  return res.data
}

export async function updateTemplateNode(
  nodeId: string,
  payload: templateNodeRepo.UpdateTemplateNodePayload
): Promise<WorkflowTemplateNode | null> {
  const res = await templateNodeRepo.fetchUpdateTemplateNode(nodeId, payload)
  return res.data
}

export async function getInstances(projectId: string): Promise<WorkflowInstance[]> {
  const res = await instanceRepo.fetchInstanceList(projectId)
  return res.data
}

export async function getInstanceDetail(id: string): Promise<WorkflowInstance | null> {
  const res = await instanceRepo.fetchInstanceDetail(id)
  return res.data
}

export async function getInstanceNodes(
  workflowInstanceId: string
): Promise<WorkflowInstanceNode[]> {
  const res = await instanceNodeRepo.fetchNodesByInstanceId(workflowInstanceId)
  return res.data
}

export async function getInstancesForTenant(
  tenantId: string
): Promise<WorkflowInstanceListItem[]> {
  const res = await instanceRepo.fetchInstanceListForTenant(tenantId)
  return res.data
}

/**
 * 项目详情页发起流程与任务：先创建流程实例，再创建关联任务
 */
export async function createWorkflowInstanceAndTask(
  projectId: string,
  payload: CreateWorkflowInstancePayload
): Promise<{ workflowInstance: WorkflowInstance; task: TaskItem }> {
  const instanceRes = await instanceRepo.createInstanceRepo(payload)
  const instance = instanceRes.data
  if (!instance) throw new Error('创建流程实例失败')
  const template = await getTemplateDetail(instance.templateId ?? '')
  const workflowName = template?.name ?? '未指定流程'
  const task = await taskService.createTask(projectId, {
    taskName: payload.taskName,
    identityId: payload.identityId,
    workflowName,
    workflowTemplateId: instance.templateId,
    workflowInstanceId: instance.id,
    currentNodeKey: instance.currentNodeKey,
  })
  return { workflowInstance: instance, task }
}

/** 根据项目目标/SOP 推荐流程模板（占位：返回固定 1～2 条） */
export async function getRecommendedTemplatesForProject(
  _projectId: string
): Promise<WorkflowTemplate[]> {
  await new Promise((r) => setTimeout(r, 80))
  return []
}

/** 任务执行详情页：聚合任务、实例、模板、节点、项目名 */
export async function getTaskExecutionView(
  projectId: string,
  taskId: string
): Promise<TaskExecutionView | null> {
  const task = await fetchTaskDetail(projectId, taskId)
  if (!task || !task.workflowInstanceId) return null
  const instance = await getInstanceDetail(task.workflowInstanceId)
  if (!instance) return null
  const template = instance.templateId
    ? await getTemplateDetail(instance.templateId)
    : null
  const nodes = await getInstanceNodes(task.workflowInstanceId)
  const templateNodes = instance.templateId
    ? (await getTemplateNodes(instance.templateId)).sort((a, b) => a.orderIndex - b.orderIndex)
    : []
  const nodeOrder = new Map(templateNodes.map((t) => [t.nodeKey, t.orderIndex]))
  const sortedNodes = [...nodes].sort(
    (a, b) => (nodeOrder.get(a.nodeKey) ?? 999) - (nodeOrder.get(b.nodeKey) ?? 999)
  )
  let projectName = '—'
  try {
    const projectRes = await projectRepo.fetchProjectDetail(projectId)
    if (projectRes.code === 0 && projectRes.data) projectName = projectRes.data.name ?? '—'
  } catch {
    // 忽略，使用默认
  }
  return {
    task,
    instance,
    template,
    nodes: sortedNodes,
    templateNodes,
    projectName,
  }
}

/** 结果回写占位：待后端提供 POST /api/projects/:id/result-feeds 后接入 */
function appendResultFeedNoOp(
  _projectId: string,
  _item: { source: string; count: string; updatedAt: string; identityId?: string; identityName?: string }
): void {
  // no-op
}

/**
 * 完成任务/实例：将当前节点与实例置为成功，任务置为已完成，并回写一条结果到项目
 */
export async function completeTaskOrInstance(
  projectId: string,
  taskId: string
): Promise<void> {
  const view = await getTaskExecutionView(projectId, taskId)
  if (!view) throw new Error('任务或流程实例不存在')
  const { task, instance, nodes } = view
  const currentKey = instance.currentNodeKey
  const currentNode = nodes.find((n) => n.nodeKey === currentKey)
  if (currentNode) {
    const res = await instanceNodeRepo.updateNode(currentNode.id, { status: 'completed' })
    if (res.code !== 0) throw new Error(res.message)
  }
  const instRes = await instanceRepo.updateInstance(instance.id, { status: 'success' })
  if (instRes.code !== 0) throw new Error(instRes.message)
  taskRepo.fetchUpdateTaskStatus(taskId, '已完成').catch((e: unknown) => {
    console.warn('[workflowExecutionService] 更新任务状态失败（不阻断流程）', e)
  })
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
  appendResultFeedNoOp(projectId, {
    source: task.taskName,
    count: '1 条',
    updatedAt: now,
    identityId: task.identityId,
    identityName: task.identityName ?? undefined,
  })
}

/**
 * 运行流程执行闭环：从当前节点起依次执行所有节点，对接 executeWorkerNode
 * 1. 加载实例与模板节点 2. 按 orderIndex 顺序遍历 3. 对需执行的节点调用 executeWorkerNode 4. 更新实例状态
 */
export async function runExecutionFlow(instanceId: string): Promise<void> {
  const instanceRes = await instanceRepo.fetchInstanceDetail(instanceId)
  if (instanceRes.code !== 0 || !instanceRes.data) throw new Error('流程实例不存在')
  const instance = instanceRes.data
  const templateId = instance.templateId ?? instance.workflowTemplateId
  if (!templateId) throw new Error('流程实例未关联模板')

  const [nodesRes, templateNodesRes] = await Promise.all([
    instanceNodeRepo.fetchNodesByInstanceId(instanceId),
    templateNodeRepo.fetchNodesByTemplateId(templateId),
  ])
  if (nodesRes.code !== 0 || !nodesRes.data) throw new Error('获取实例节点失败')
  if (templateNodesRes.code !== 0 || !templateNodesRes.data) throw new Error('获取模板节点失败')
  const nodes = nodesRes.data
  const templateNodes = [...templateNodesRes.data].sort((a, b) => a.orderIndex - b.orderIndex)
  if (templateNodes.length === 0) return

  const orderMap = new Map(templateNodes.map((t) => [t.nodeKey ?? t.key, t.orderIndex]))
  const sortedNodes = [...nodes].sort(
    (a, b) => (orderMap.get(a.nodeKey) ?? 999) - (orderMap.get(b.nodeKey) ?? 999)
  )
  const currentKey = instance.currentNodeKey
  let startIdx = currentKey
    ? sortedNodes.findIndex((n) => n.nodeKey === currentKey)
    : 0
  if (startIdx < 0) startIdx = 0
  if (instance.status === 'success') throw new Error('流程已执行完成')

  await instanceRepo.updateInstance(instanceId, { status: 'running' })

  for (let i = startIdx; i < sortedNodes.length; i++) {
    const instNode = sortedNodes[i]
    const tIdx = templateNodes.findIndex((t) => (t.nodeKey ?? t.key) === instNode.nodeKey)
    const tNode = tIdx >= 0 ? templateNodes[tIdx] : null
    const nextTNode = tIdx >= 0 && tIdx + 1 < templateNodes.length ? templateNodes[tIdx + 1] : null
    const nextKey = (tNode as { nextNodeKey?: string })?.nextNodeKey ?? nextTNode?.nodeKey ?? nextTNode?.key

    const isAgentNode =
      tNode?.executionType === 'agent_task' ||
      tNode?.nodeType === 'agent' ||
      (tNode as { nodeType?: string })?.nodeType === 'agent'
    if (instNode.status === 'completed') {
      await instanceRepo.updateInstance(instanceId, { currentNodeKey: nextKey ?? undefined })
      continue
    }
    if (isAgentNode) {
      const result = await executeWorkerNode(instanceId, instNode.id)
      if (!result.success) {
        await instanceRepo.updateInstance(instanceId, { status: 'failed' })
        throw new Error(result.errorMessageZh ?? result.errorMessage ?? '节点执行失败')
      }
    } else {
      await instanceNodeRepo.updateNode(instNode.id, { status: 'completed' })
    }
    await instanceRepo.updateInstance(instanceId, { currentNodeKey: nextKey ?? undefined })
  }

  await instanceRepo.updateInstance(instanceId, { status: 'success' })
}

/**
 * 按任务执行流程（由任务执行页调用：先解析 instanceId 再执行）
 */
export async function runExecutionFlowForTask(
  projectId: string,
  taskId: string
): Promise<void> {
  const view = await getTaskExecutionView(projectId, taskId)
  if (!view) throw new Error('任务或流程实例不存在')
  await runExecutionFlow(view.instance.id)
  const taskRes = await taskRepo.fetchUpdateTaskStatus(taskId, '已完成')
  if (taskRes.code !== 0) {
    console.warn('[workflowExecutionService] 更新任务状态失败（不阻断流程）', taskRes.message)
  }
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
  appendResultFeedNoOp(projectId, {
    source: view.task.taskName,
    count: '1 条',
    updatedAt: now,
    identityId: view.task.identityId,
    identityName: view.task.identityName ?? undefined,
  })
}

/** @deprecated 使用 runExecutionFlowForTask */
export const runMockExecutionFlow = runExecutionFlowForTask

/**
 * 审核通过/驳回（占位）：更新当前节点与实例状态，通过则可选完成并回写
 */
export async function advanceReview(
  projectId: string,
  taskId: string,
  approved: boolean
): Promise<void> {
  const view = await getTaskExecutionView(projectId, taskId)
  if (!view) throw new Error('任务或流程实例不存在')
  const { task, instance, nodes } = view
  const currentKey = instance.currentNodeKey
  const currentNode = nodes.find((n) => n.nodeKey === currentKey)
  if (currentNode) {
    const res = await instanceNodeRepo.updateNode(currentNode.id, {
      status: approved ? 'completed' : 'failed',
    })
    if (res.code !== 0) throw new Error(res.message)
  }
  const instRes = await instanceRepo.updateInstance(instance.id, {
    status: approved ? 'success' : 'failed',
  })
  if (instRes.code !== 0) throw new Error(instRes.message)
  taskRepo.fetchUpdateTaskStatus(taskId, approved ? '已完成' : '失败').catch((e: unknown) => {
    console.warn('[workflowExecutionService] 更新任务状态失败（不阻断流程）', e)
  })
  if (approved) {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
    appendResultFeedNoOp(projectId, {
      source: task.taskName,
      count: '1 条',
      updatedAt: now,
      identityId: task.identityId,
      identityName: task.identityName ?? undefined,
    })
  }
}
