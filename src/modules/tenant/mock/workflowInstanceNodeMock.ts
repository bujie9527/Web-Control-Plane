/**
 * 流程实例节点 Mock，按 workflowInstanceId 维度
 */
import type {
  WorkflowInstanceNode,
  WorkflowInstanceNodeStatus,
  RecoveryStatus,
} from '../schemas/workflowExecution'
import { getNodesByTemplateId } from './workflowTemplateNodeMock'

const instanceNodes: WorkflowInstanceNode[] = [
  { id: 'in1-1', workflowInstanceId: 'wi1', templateNodeId: 'wn1-1', nodeKey: 'step1', nodeName: '内容撰写', nodeType: 'agent', executorType: 'agent', executionType: 'agent_task', intentType: 'create', status: 'completed', startedAt: '2025-03-08 09:00', finishedAt: '2025-03-08 09:45', createdAt: '2025-03-08 09:00', updatedAt: '2025-03-08 09:45' },
  { id: 'in1-2', workflowInstanceId: 'wi1', templateNodeId: 'wn1-2', nodeKey: 'step2', nodeName: '人工审核', nodeType: 'review', executorType: 'human', executionType: 'human_review', intentType: 'review', status: 'running', startedAt: '2025-03-08 09:46', createdAt: '2025-03-08 09:46', updatedAt: '2025-03-08 10:30' },
  { id: 'in1-3', workflowInstanceId: 'wi1', templateNodeId: 'wn1-3', nodeKey: 'step3', nodeName: '发布执行', nodeType: 'manual', executorType: 'human', executionType: 'manual_input', intentType: 'publish', status: 'pending', createdAt: '2025-03-08 09:00', updatedAt: '2025-03-08 09:00' },
  { id: 'in2-1', workflowInstanceId: 'wi2', templateNodeId: 'wn2-1', nodeKey: 'step1', nodeName: '批量拉取', nodeType: 'system', executorType: 'system', status: 'completed', startedAt: '2025-03-08 08:00', finishedAt: '2025-03-08 08:05', createdAt: '2025-03-08 08:00', updatedAt: '2025-03-08 08:05' },
  { id: 'in2-2', workflowInstanceId: 'wi2', templateNodeId: 'wn2-2', nodeKey: 'step2', nodeName: 'Agent 初筛', nodeType: 'agent', executorType: 'agent', status: 'completed', startedAt: '2025-03-08 08:06', finishedAt: '2025-03-08 08:12', createdAt: '2025-03-08 08:06', updatedAt: '2025-03-08 08:12' },
  { id: 'in2-3', workflowInstanceId: 'wi2', templateNodeId: 'wn2-3', nodeKey: 'step3', nodeName: '人工抽检', nodeType: 'review', executorType: 'human', executionType: 'human_review', intentType: 'review', status: 'waiting_review', startedAt: '2025-03-08 08:15', createdAt: '2025-03-08 08:15', updatedAt: '2025-03-08 08:15' },
  { id: 'in3-1', workflowInstanceId: 'wi3', templateNodeId: 'wn3-1', nodeKey: 'step1', nodeName: '数据拉取', nodeType: 'system', executorType: 'api', status: 'completed', startedAt: '2025-03-08 08:30', finishedAt: '2025-03-08 08:50', createdAt: '2025-03-08 08:30', updatedAt: '2025-03-08 08:50' },
  { id: 'in3-2', workflowInstanceId: 'wi3', templateNodeId: 'wn3-2', nodeKey: 'step2', nodeName: '清洗入库', nodeType: 'system', executorType: 'system', status: 'completed', startedAt: '2025-03-08 08:51', finishedAt: '2025-03-08 09:00', createdAt: '2025-03-08 08:51', updatedAt: '2025-03-08 09:00' },
  { id: 'in4-1', workflowInstanceId: 'wi4', templateNodeId: 'wn3-1', nodeKey: 'step1', nodeName: '数据拉取', nodeType: 'system', executorType: 'api', status: 'running', startedAt: '2025-03-08 09:00', createdAt: '2025-03-08 09:00', updatedAt: '2025-03-08 09:00' },
  { id: 'in4-2', workflowInstanceId: 'wi4', templateNodeId: 'wn3-2', nodeKey: 'step2', nodeName: '清洗入库', nodeType: 'system', executorType: 'system', status: 'pending', createdAt: '2025-03-08 09:00', updatedAt: '2025-03-08 09:00' },
  { id: 'in-fb-1', workflowInstanceId: 'wi5', templateNodeId: 'wn-fb-1', nodeKey: 'create', nodeName: '内容生成', nodeType: 'agent', executorType: 'agent', executionType: 'agent_task', intentType: 'create', status: 'running', startedAt: '2025-03-08 11:00', createdAt: '2025-03-08 11:00', updatedAt: '2025-03-08 11:00' },
  { id: 'in-fb-2', workflowInstanceId: 'wi5', templateNodeId: 'wn-fb-2', nodeKey: 'review', nodeName: '内容审核', nodeType: 'agent', executorType: 'agent', status: 'pending', createdAt: '2025-03-08 11:00', updatedAt: '2025-03-08 11:00' },
  { id: 'in-fb-3', workflowInstanceId: 'wi5', templateNodeId: 'wn-fb-3', nodeKey: 'publish', nodeName: '发布', nodeType: 'agent', executorType: 'agent', status: 'pending', createdAt: '2025-03-08 11:00', updatedAt: '2025-03-08 11:00' },
  { id: 'in-fb-4', workflowInstanceId: 'wi5', templateNodeId: 'wn-fb-4', nodeKey: 'record', nodeName: '结果记录', nodeType: 'agent', executorType: 'agent', status: 'pending', createdAt: '2025-03-08 11:00', updatedAt: '2025-03-08 11:00' },
  { id: 'in6-1', workflowInstanceId: 'wi6', templateNodeId: 'wn1-1', nodeKey: 'step1', nodeName: '内容撰写', nodeType: 'agent', executorType: 'agent', executionType: 'agent_task', intentType: 'create', status: 'failed', startedAt: '2025-03-08 14:00', errorSummary: '模型调用超时', retryCount: 1, lastErrorCode: 'TIMEOUT', lastErrorSummary: '模型调用超时', recoveryStatus: 'none', createdAt: '2025-03-08 14:00', updatedAt: '2025-03-08 14:05' },
  { id: 'in6-2', workflowInstanceId: 'wi6', templateNodeId: 'wn1-2', nodeKey: 'step2', nodeName: '人工审核', nodeType: 'review', executorType: 'human', status: 'pending', createdAt: '2025-03-08 14:00', updatedAt: '2025-03-08 14:00' },
  { id: 'in6-3', workflowInstanceId: 'wi6', templateNodeId: 'wn1-3', nodeKey: 'step3', nodeName: '发布执行', nodeType: 'manual', executorType: 'human', status: 'pending', createdAt: '2025-03-08 14:00', updatedAt: '2025-03-08 14:00' },
]

/** 为新建的流程实例根据模板生成实例节点 */
export function createNodesForInstance(workflowInstanceId: string, templateId: string): WorkflowInstanceNode[] {
  const templateNodes = getNodesByTemplateId(templateId)
  if (templateNodes.length === 0) return []
  const sorted = [...templateNodes].sort((a, b) => a.orderIndex - b.orderIndex)
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
  const base = instanceNodes.length + 1
  const created: WorkflowInstanceNode[] = []
  for (let i = 0; i < sorted.length; i++) {
    const t = sorted[i]
    const status: WorkflowInstanceNodeStatus = i === 0 ? 'running' : 'pending'
    const node: WorkflowInstanceNode = {
      id: `in${base}-${i + 1}`,
      workflowInstanceId,
      templateNodeId: t.id,
      nodeKey: t.nodeKey,
      nodeName: t.nodeName,
      nodeType: t.nodeType,
      executorType: t.executorType,
      status,
      createdAt: now,
      updatedAt: now,
    }
    if (i === 0) node.startedAt = now
    instanceNodes.push(node)
    created.push(node)
  }
  return created
}

/** 更新实例节点状态（审核通过/驳回、完成等） */
export function updateNodeStatus(nodeId: string, status: WorkflowInstanceNodeStatus): void {
  const node = instanceNodes.find((n) => n.id === nodeId)
  if (!node) return
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
  node.status = status
  node.updatedAt = now
  if (status === 'completed' || status === 'failed' || status === 'skipped') node.finishedAt = now
  if (!node.startedAt) node.startedAt = now
}

/** 更新实例节点结果摘要（Mock Executor 使用） */
export function updateNodeResultSummary(
  nodeId: string,
  resultSummary: string,
  status: WorkflowInstanceNodeStatus = 'completed'
): void {
  const node = instanceNodes.find((n) => n.id === nodeId)
  if (!node) return
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
  node.resultSummary = resultSummary
  node.status = status
  node.updatedAt = now
  if (status === 'completed' || status === 'failed' || status === 'skipped') node.finishedAt = now
  if (!node.startedAt) node.startedAt = now
}

export function getNodesByInstanceId(workflowInstanceId: string): WorkflowInstanceNode[] {
  return instanceNodes.filter((n) => n.workflowInstanceId === workflowInstanceId).sort((a, b) => a.nodeKey.localeCompare(b.nodeKey))
}

export function getInstanceNodeById(id: string): WorkflowInstanceNode | null {
  return instanceNodes.find((n) => n.id === id) ?? null
}

/** 更新节点恢复信息（Phase 16） */
export function updateNodeRecoveryInfo(
  nodeId: string,
  info: {
    retryCount?: number
    lastErrorCode?: string
    lastErrorSummary?: string
    recoveryStatus?: RecoveryStatus
    lastRecoveryAction?: string
  }
): void {
  const node = instanceNodes.find((n) => n.id === nodeId)
  if (!node) return
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
  if (info.retryCount !== undefined) node.retryCount = info.retryCount
  if (info.lastErrorCode !== undefined) node.lastErrorCode = info.lastErrorCode
  if (info.lastErrorSummary !== undefined) node.lastErrorSummary = info.lastErrorSummary
  if (info.recoveryStatus !== undefined) node.recoveryStatus = info.recoveryStatus
  if (info.lastRecoveryAction !== undefined) node.lastRecoveryAction = info.lastRecoveryAction
  node.updatedAt = now
}

/** 更新节点选中 Agent（Phase 16 切换备用 Agent） */
export function updateNodeSelectedAgent(nodeId: string, agentTemplateId: string): void {
  const node = instanceNodes.find((n) => n.id === nodeId)
  if (!node) return
  node.selectedAgentTemplateId = agentTemplateId
  node.updatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
}

/** 更新节点选中 Skill（Phase 16 切换备用 Skill） */
export function updateNodeSelectedSkills(nodeId: string, skillIds: string[]): void {
  const node = instanceNodes.find((n) => n.id === nodeId)
  if (!node) return
  node.selectedSkillIds = skillIds
  node.updatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
}

/** 更新节点 Worker 执行结果（Phase 17） */
export function updateNodeWorkerResult(
  nodeId: string,
  payload: {
    resultSummary?: string
    reviewSummary?: string
    workerOutputJson?: Record<string, unknown>
    workerExecutionModel?: string
    workerExecutionDurationMs?: number
    workerExecutionAgentId?: string
    status: WorkflowInstanceNodeStatus
    errorSummary?: string
  }
): void {
  const node = instanceNodes.find((n) => n.id === nodeId)
  if (!node) return
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
  if (payload.resultSummary !== undefined) node.resultSummary = payload.resultSummary
  if (payload.reviewSummary !== undefined) node.reviewSummary = payload.reviewSummary
  if (payload.workerOutputJson !== undefined) node.workerOutputJson = payload.workerOutputJson
  if (payload.workerExecutionModel !== undefined) node.workerExecutionModel = payload.workerExecutionModel
  if (payload.workerExecutionDurationMs !== undefined) node.workerExecutionDurationMs = payload.workerExecutionDurationMs
  if (payload.workerExecutionAgentId !== undefined) node.workerExecutionAgentId = payload.workerExecutionAgentId
  if (payload.errorSummary !== undefined) node.errorSummary = payload.errorSummary
  node.status = payload.status
  node.updatedAt = now
  if (payload.status === 'completed' || payload.status === 'failed' || payload.status === 'skipped') {
    node.finishedAt = now
    node.completedAt = now
  }
  if (!node.startedAt) node.startedAt = now
}
