/**
 * 流程运行中心服务（Phase 18 — 接入真实 API）
 *
 * 迁移说明：
 *   Before: 全部调用 workflowInstanceMock / workflowInstanceNodeMock / workflowRuntimeLogMock / workflowSupervisorDecisionMock
 *   After:  调用各 Repository → 后端 API → Prisma
 *
 * 注：运行日志 (WorkflowRuntimeLog) 在初期可能返回空列表，Phase 18.x 完成写入后自动填充。
 */
import type { WorkflowInstance, WorkflowInstanceNode, WorkflowSupervisorDecision } from '../schemas/workflowExecution'
import type { WorkflowRuntimeLog } from '../schemas/workflowRuntime'
import * as instanceRepo from '../repositories/workflowInstanceRepository'
import * as instanceNodeRepo from '../repositories/workflowInstanceNodeRepository'
import * as runtimeLogRepo from '../repositories/workflowRuntimeLogRepository'
import * as supervisorDecisionRepo from '../repositories/workflowSupervisorDecisionRepository'

type WorkflowInstanceWithMeta = WorkflowInstance & { createdAt?: string; updatedAt?: string }

// ─── 列表项类型 ───────────────────────────────────────────────────────────────

export interface WorkflowRuntimeListItem {
  id: string
  projectId: string
  workflowTemplateId: string
  status: string
  /** 节点进度文本，如 "3/5" */
  progressText: string
  currentNodeName?: string
  waitingForReview: boolean
  isFailed: boolean
  createdAt: string
  updatedAt: string
  /** 展示用 */
  instanceName?: string
  projectName?: string
  templateName?: string
  sourceSummary?: string
}

export interface WorkflowRuntimeDetailView {
  instance: WorkflowInstance
  nodes: WorkflowInstanceNode[]
  logs: WorkflowRuntimeLog[]
  supervisorDecisions: WorkflowSupervisorDecision[]
  progressText: string
  /** 展示用 */
  instanceName?: string
  projectName?: string
  templateName?: string
  templateNodes?: import('../schemas/workflowExecution').WorkflowTemplateNode[]
}

// ─── 列表 ─────────────────────────────────────────────────────────────────────

/**
 * 获取租户下所有流程实例列表（含进度等计算字段）
 */
export async function getRuntimeListForTenant(
  tenantId: string
): Promise<WorkflowRuntimeListItem[]> {
  const res = await instanceRepo.fetchInstanceListForTenant(tenantId)
  if (res.code !== 0 || !res.data) return []
  const list = res.data
  const result: WorkflowRuntimeListItem[] = []
  for (const inst of list) {
    const instAny = inst as WorkflowInstance & { workflowTemplateId?: string }
    const templateId = instAny.workflowTemplateId ?? (inst as { templateId?: string }).templateId
    let nodes: WorkflowInstanceNode[] = []
    try {
      const nodeRes = await instanceNodeRepo.fetchNodesByInstanceId(inst.id)
      if (nodeRes.code === 0 && nodeRes.data) nodes = nodeRes.data
    } catch {
      // ignore
    }
    const total = nodes.length
    const completed = nodes.filter((n) => n.status === 'completed').length
    const progressText = total > 0 ? `${completed}/${total}` : '0/0'
    const waitingForReview = nodes.some((n) => n.status === 'waiting_review')
    const isFailed =
      inst.status === 'failed' || nodes.some((n) => n.status === 'failed')
    const currentNode = nodes.find((n) => n.status === 'running' || n.status === 'waiting_review')
    result.push({
      id: inst.id,
      projectId: (inst as { projectId?: string }).projectId ?? '',
      workflowTemplateId: templateId ?? '',
      status: inst.status,
      progressText,
      currentNodeName: currentNode?.name,
      waitingForReview,
      isFailed,
      createdAt: (inst as { createdAt?: string }).createdAt ?? '',
      updatedAt: (inst as { updatedAt?: string }).updatedAt ?? '',
    })
  }
  return result
}

// ─── 详情 ─────────────────────────────────────────────────────────────────────

/**
 * 获取流程实例运行详情（实例 + 节点 + 日志 + 监督决策）
 */
export async function getRuntimeDetail(
  instanceId: string
): Promise<WorkflowRuntimeDetailView | null> {
  try {
    const [instRes, nodesRes, logsRes, decisionsRes] = await Promise.all([
      instanceRepo.fetchInstanceDetail(instanceId),
      instanceNodeRepo.fetchNodesByInstanceId(instanceId),
      runtimeLogRepo.fetchRuntimeLogs(instanceId),
      supervisorDecisionRepo.fetchSupervisorDecisions(instanceId),
    ])
    if (instRes.code !== 0 || !instRes.data) return null
    const instance = instRes.data as WorkflowInstanceWithMeta
    const nodes = nodesRes.code === 0 ? (nodesRes.data ?? []) : []
    const logs = logsRes.code === 0 ? (logsRes.data ?? []) : []
    const supervisorDecisions = decisionsRes.code === 0 ? (decisionsRes.data ?? []) : []
    const total = nodes.length
    const completed = nodes.filter((n) => n.status === 'completed').length
    const progressText = total > 0 ? `${completed}/${total}` : '0/0'
    return {
      instance,
      nodes,
      logs,
      supervisorDecisions,
      progressText,
    }
  } catch {
    return null
  }
}

// ─── 人工操作 ─────────────────────────────────────────────────────────────────

/**
 * 更新实例状态（暂停 / 继续 / 中止等人工操作）
 */
export async function updateInstanceStatus(
  instanceId: string,
  status: string,
  operatorId?: string
): Promise<void> {
  await instanceRepo.updateInstance(instanceId, { status })
  const eventType =
    status === 'paused'
      ? 'workflow_paused'
      : status === 'aborted'
        ? 'workflow_aborted'
        : status === 'running'
          ? 'manual_continue'
          : 'workflow_started'
  await runtimeLogRepo.appendRuntimeLog(instanceId, {
    eventType,
    messageZh: `实例状态已更新为：${status}`,
    operatorId,
  })
}

/**
 * 重试节点（更新节点 status 为 pending，写入日志）
 */
export async function retryInstanceNode(
  instanceId: string,
  nodeId: string,
  operatorId?: string
): Promise<void> {
  await instanceNodeRepo.updateNode(nodeId, { status: 'pending' })
  await runtimeLogRepo.appendRuntimeLog(instanceId, {
    nodeId,
    eventType: 'node_started',
    messageZh: '节点重试',
    operatorId,
  })
}

/**
 * 应用监督建议（更新 decision.status = 'applied'）
 */
export async function applySupervisorDecision(
  decisionId: string,
  _instanceId: string,
  appliedBy?: string
): Promise<void> {
  await supervisorDecisionRepo.updateDecisionStatus(decisionId, 'applied', appliedBy)
}

/**
 * 忽略监督建议
 */
export async function dismissSupervisorDecision(
  decisionId: string,
  appliedBy?: string
): Promise<void> {
  await supervisorDecisionRepo.updateDecisionStatus(decisionId, 'dismissed', appliedBy)
}

/** 平台/租户列表（租户维度，传入 tenantId） */
export async function getRuntimeListForPlatform(tenantId: string): Promise<WorkflowRuntimeListItem[]> {
  return getRuntimeListForTenant(tenantId)
}

/** 重试节点（别名） */
export const retryNode = retryInstanceNode

/** 暂停流程 */
export async function pauseWorkflow(instanceId: string, operatorId?: string): Promise<void> {
  return updateInstanceStatus(instanceId, 'paused', operatorId)
}

/** 继续执行 */
export async function continueWorkflow(instanceId: string, operatorId?: string): Promise<void> {
  return updateInstanceStatus(instanceId, 'running', operatorId)
}

/** 审核通过（继续） */
export async function approveReview(instanceId: string, nodeId: string, operatorId?: string): Promise<void> {
  await instanceNodeRepo.updateNode(nodeId, { status: 'completed' })
  await runtimeLogRepo.appendRuntimeLog(instanceId, {
    nodeId,
    eventType: 'manual_continue',
    messageZh: '审核通过',
    operatorId,
  })
}

/** 跳过节点 */
export async function skipNode(
  instanceId: string,
  nodeId: string,
  operatorId?: string
): Promise<void> {
  await instanceNodeRepo.updateNode(nodeId, { status: 'skipped' })
  await runtimeLogRepo.appendRuntimeLog(instanceId, {
    nodeId,
    eventType: 'node_completed',
    messageZh: '节点已跳过',
    operatorId,
  })
}

/** 中止流程 */
export async function abortWorkflow(instanceId: string, operatorId?: string): Promise<void> {
  return updateInstanceStatus(instanceId, 'canceled', operatorId)
}
