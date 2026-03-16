/**
 * 流程实例 Mock，按 projectId 维度
 */
import type { WorkflowInstance, WorkflowInstanceStatus } from '../schemas/workflowExecution'
import type { CreateWorkflowInstancePayload } from '../schemas/workflowExecution'
import { getProjectById } from './projectMock'
import { getIdentityById } from './identityMock'
import { getTemplateById } from './workflowTemplateMock'
import { getFirstNodeKeyByTemplateId } from './workflowTemplateNodeMock'
import { createNodesForInstance } from './workflowInstanceNodeMock'

/** 租户下实例列表项：实例 + 展示用 projectName、identityName、templateName */
export interface WorkflowInstanceListItem extends WorkflowInstance {
  projectName?: string
  identityName?: string
  templateName?: string
}

/** 当前 mock 中租户 t1 对应的项目 ID 列表 */
const TENANT_PROJECT_IDS: Record<string, string[]> = {
  t1: ['p1', 'p2', 'p3', 'p5'],
}

const instancesByProjectId: Record<string, WorkflowInstance[]> = {
  p1: [
    {
      id: 'wi1',
      projectId: 'p1',
      templateId: 'wt1',
      identityId: 'id1',
      status: 'running',
      currentNodeKey: 'step2',
      sourceType: 'template',
      sourceSummary: '基于模板「社媒发布流程」',
      createdAt: '2025-03-08 09:00',
      updatedAt: '2025-03-08 10:30',
    },
    {
      id: 'wi2',
      projectId: 'p1',
      templateId: 'wt2',
      identityId: 'id2',
      status: 'waiting_review',
      currentNodeKey: 'step3',
      sourceType: 'template',
      sourceSummary: '基于模板「内容审核流程」',
      createdAt: '2025-03-08 08:00',
      updatedAt: '2025-03-08 08:15',
    },
    {
      id: 'wi3',
      projectId: 'p1',
      templateId: 'wt3',
      identityId: 'id1',
      status: 'success',
      currentNodeKey: 'step2',
      sourceType: 'template',
      sourceSummary: '基于模板「数据同步流程」',
      createdAt: '2025-03-08 08:30',
      updatedAt: '2025-03-08 09:00',
    },
    {
      id: 'wi6',
      projectId: 'p1',
      templateId: 'wt1',
      identityId: 'id1',
      status: 'failed',
      currentNodeKey: 'step1',
      sourceType: 'template',
      sourceSummary: '基于模板「社媒发布流程」- 恢复演示',
      createdAt: '2025-03-08 14:00',
      updatedAt: '2025-03-08 14:10',
    },
  ],
  p2: [
    {
      id: 'wi4',
      projectId: 'p2',
      templateId: 'wt3',
      identityId: 'id3',
      status: 'running',
      currentNodeKey: 'step1',
      sourceType: 'template',
      sourceSummary: '基于模板「数据同步流程」',
      createdAt: '2025-03-07 10:00',
      updatedAt: '2025-03-08 09:00',
    },
  ],
  p3: [],
  p5: [
    {
      id: 'wi5',
      projectId: 'p5',
      templateId: 'wt-facebook',
      identityId: 'id1',
      status: 'running',
      currentNodeKey: 'create',
      sourceType: 'template',
      sourceSummary: '基于模板「Facebook 社媒闭环」',
      createdAt: '2025-03-08 11:00',
      updatedAt: '2025-03-08 11:00',
    },
  ],
}

export function getInstancesByProjectId(projectId: string): WorkflowInstance[] {
  return instancesByProjectId[projectId] ?? []
}

/** 获取所有流程实例（供引用检查等使用） */
export function listAllWorkflowInstances(): WorkflowInstance[] {
  return Object.values(instancesByProjectId).flat()
}

export function getInstanceById(id: string): WorkflowInstance | null {
  for (const list of Object.values(instancesByProjectId)) {
    const found = list.find((i) => i.id === id)
    if (found) return found
  }
  return null
}

/** 按租户聚合实例列表，附带 projectName、identityName、templateName */
export function getInstancesForTenant(tenantId: string): WorkflowInstanceListItem[] {
  const projectIds = TENANT_PROJECT_IDS[tenantId] ?? []
  const list: WorkflowInstanceListItem[] = []
  for (const projectId of projectIds) {
    const instances = getInstancesByProjectId(projectId)
    for (const inst of instances) {
      const project = getProjectById(projectId)
      const identity = inst.identityId ? getIdentityById(inst.identityId) : undefined
      const template = inst.templateId ? getTemplateById(inst.templateId) : null
      list.push({
        ...inst,
        projectName: project?.name,
        identityName: identity?.name,
        templateName: template?.name ?? undefined,
      })
    }
  }
  list.sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1))
  return list
}

function nextInstanceId(): string {
  let max = 0
  for (const list of Object.values(instancesByProjectId)) {
    for (const i of list) {
      const n = parseInt(i.id.replace(/\D/g, ''), 10)
      if (!isNaN(n)) max = Math.max(max, n)
    }
  }
  return `wi${max + 1}`
}

/**
 * 创建流程实例（用于项目详情页发起流程与任务）
 * 写入 instancesByProjectId，返回新实例；后续由 service 层再创建关联 Task
 */
export function createInstance(payload: CreateWorkflowInstancePayload): WorkflowInstance {
  const { projectId, templateId, identityId, sourceType = 'template' } = payload
  const template = getTemplateById(templateId)
  const sourceSummary = template
    ? `基于模板「${template.name}」`
    : sourceType === 'sop_suggestion'
      ? '根据目标与 SOP 建议'
      : '手动创建'
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
  const currentNodeKey = getFirstNodeKeyByTemplateId(templateId) ?? 'step1'
  const status: WorkflowInstanceStatus = 'pending'
  const newInstance: WorkflowInstance = {
    id: nextInstanceId(),
    projectId,
    templateId,
    identityId,
    status,
    currentNodeKey,
    sourceType,
    sourceSummary,
    createdAt: now,
    updatedAt: now,
  }
  if (!instancesByProjectId[projectId]) instancesByProjectId[projectId] = []
  instancesByProjectId[projectId].push(newInstance)
  createNodesForInstance(newInstance.id, templateId)
  return newInstance
}

/** 更新流程实例状态（完成/失败/取消等） */
export function updateInstanceStatus(instanceId: string, status: WorkflowInstanceStatus): void {
  const instance = getInstanceById(instanceId)
  if (!instance) return
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
  instance.status = status
  instance.updatedAt = now
}

/** 更新流程实例当前节点（Mock 执行推进用） */
export function updateInstanceCurrentNode(instanceId: string, nextNodeKey: string | undefined): void {
  const instance = getInstanceById(instanceId)
  if (!instance) return
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
  instance.currentNodeKey = nextNodeKey
  instance.updatedAt = now
  if (!nextNodeKey) instance.status = 'success' as WorkflowInstanceStatus
}
