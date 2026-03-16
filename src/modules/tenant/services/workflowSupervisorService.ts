/**
 * 流程监督服务（Phase 14/16 / Phase C）
 * 基于规则分析，生成结构化监督建议；读写走真实 API
 */
import type { WorkflowSupervisorDecision } from '../schemas/workflowExecution'
import type { WorkflowRuntimeEventType, SupervisorDecisionType } from '../schemas/workflowRuntime'
import { analyzeRecoveryForNode } from './workflowSupervisorRecoveryService'
import * as workflowInstanceRepo from '../repositories/workflowInstanceRepository'
import * as workflowInstanceNodeRepo from '../repositories/workflowInstanceNodeRepository'
import * as workflowSupervisorDecisionRepo from '../repositories/workflowSupervisorDecisionRepository'
import * as workflowRuntimeLogRepo from '../repositories/workflowRuntimeLogRepository'
import {
  retryNode,
  skipNode,
  approveReview,
  continueWorkflow,
  abortWorkflow,
} from './workflowRuntimeService'

async function appendLog(
  instanceId: string,
  eventType: WorkflowRuntimeEventType,
  messageZh: string,
  nodeId?: string
): Promise<void> {
  try {
    await workflowRuntimeLogRepo.appendRuntimeLog(instanceId, {
      eventType,
      messageZh,
      nodeId: nodeId ?? undefined,
    })
  } catch {
    // ignore
  }
}

/** 创建监督决策（写入 API，返回执行层形状），供本模块与 recovery 使用。API 侧默认 status 为 suggested。 */
export async function createDecision(payload: {
  workflowInstanceId: string
  workflowInstanceNodeId?: string
  decisionType: string
  reason: string
  reasonZh: string
  suggestedNextAction: string
  relatedErrorSummary?: string
}): Promise<WorkflowSupervisorDecision> {
  const res = await workflowSupervisorDecisionRepo.createSupervisorDecision(
    payload.workflowInstanceId,
    {
      decisionType: payload.decisionType as SupervisorDecisionType,
      reason: payload.reasonZh || payload.reason,
      nodeId: payload.workflowInstanceNodeId,
      suggestedNextAction: payload.suggestedNextAction,
      relatedErrorSummary: payload.relatedErrorSummary,
    }
  )
  if (res.code !== 0 || !res.data) throw new Error(res.message || '创建监督决策失败')
  return res.data
}

/** 基于规则的监督分析：实例维度 */
export async function analyzeWorkflowInstance(
  instanceId: string
): Promise<WorkflowSupervisorDecision | null> {
  let instance: { status?: string } | null = null
  let nodes: Array<{ id: string; status: string; nodeKey?: string; nodeName?: string; errorSummary?: string }> = []
  try {
    const instRes = await workflowInstanceRepo.fetchInstanceDetail(instanceId)
    if (instRes.code !== 0 || !instRes.data) return null
    instance = instRes.data as { status?: string }
    const nodesRes = await workflowInstanceNodeRepo.fetchNodesByInstanceId(instanceId)
    if (nodesRes.code === 0 && nodesRes.data) nodes = nodesRes.data as typeof nodes
  } catch {
    return null
  }

  const failedNode = nodes.find((n) => n.status === 'failed')
  const waitingNode = nodes.find((n) => n.status === 'waiting_review')

  if (instance?.status === 'failed' && failedNode) {
    const recovery = await analyzeRecoveryForNode(instanceId, failedNode.id)
    if (recovery.decision) return recovery.decision
    return _suggestDecisionForFailure(instanceId, failedNode.id, nodes)
  }
  if (instance?.status === 'waiting_review' && waitingNode) {
    return suggestDecisionForWaitingReview(instanceId, waitingNode.id, nodes)
  }
  if (instance?.status === 'canceled') {
    return suggestDecisionForPaused(instanceId)
  }
  if (instance?.status === 'running' && failedNode) {
    const recovery = await analyzeRecoveryForNode(instanceId, failedNode.id)
    if (recovery.decision) return recovery.decision
    return _suggestDecisionForFailure(instanceId, failedNode.id, nodes)
  }
  return suggestNoAction(instanceId, '实例与节点状态正常，无需干预')
}

/** 基于规则的监督分析：节点维度 */
export async function analyzeWorkflowNode(
  instanceId: string,
  nodeId: string
): Promise<WorkflowSupervisorDecision | null> {
  let nodes: Array<{ id: string; status: string; nodeKey?: string; nodeName?: string }> = []
  try {
    const instRes = await workflowInstanceRepo.fetchInstanceDetail(instanceId)
    if (instRes.code !== 0 || !instRes.data) return null
    const nodesRes = await workflowInstanceNodeRepo.fetchNodesByInstanceId(instanceId)
    if (nodesRes.code === 0 && nodesRes.data) nodes = nodesRes.data as typeof nodes
  } catch {
    return null
  }
  const node = nodes.find((n) => n.id === nodeId) ?? null
  if (!node) return null

  if (node.status === 'failed') {
    const recovery = await analyzeRecoveryForNode(instanceId, nodeId)
    if (recovery.decision) return recovery.decision
    return _suggestDecisionForFailure(instanceId, nodeId, nodes)
  }
  if (node.status === 'waiting_review') return suggestDecisionForWaitingReview(instanceId, nodeId, nodes)
  return suggestNoAction(instanceId, `节点「${node.nodeName ?? node.nodeKey}」状态为 ${node.status}，暂无需干预`)
}

/** 针对失败节点生成监督建议（公开 API） */
export async function suggestDecisionForFailure(
  instanceId: string,
  nodeId: string
): Promise<WorkflowSupervisorDecision> {
  let nodes: Array<{ id: string; nodeKey?: string; nodeName?: string; errorSummary?: string }> = []
  try {
    const nodesRes = await workflowInstanceNodeRepo.fetchNodesByInstanceId(instanceId)
    if (nodesRes.code === 0 && nodesRes.data) nodes = nodesRes.data as typeof nodes
  } catch {
    // ignore
  }
  return _suggestDecisionForFailure(instanceId, nodeId, nodes)
}

function _suggestDecisionForFailure(
  instanceId: string,
  nodeId: string,
  nodes: Array<{ id: string; nodeKey?: string; nodeName?: string; errorSummary?: string }>
): Promise<WorkflowSupervisorDecision> {
  const node = nodes.find((n) => n.id === nodeId)
  const nodeName = node?.nodeName ?? node?.nodeKey ?? '未知节点'
  const errorSummary = node?.errorSummary ?? '节点执行失败'
  return createDecision({
    workflowInstanceId: instanceId,
    workflowInstanceNodeId: nodeId,
    decisionType: 'retry',
    reason: `Node ${node?.nodeKey} failed. Error: ${errorSummary}`,
    reasonZh: `节点「${nodeName}」执行失败。${errorSummary ? `错误摘要：${errorSummary}` : '建议重试或人工介入审核。'}`,
    suggestedNextAction: '重试该节点；若重试无效，建议人工审核或中止流程',
    relatedErrorSummary: errorSummary || undefined,
  })
}

function suggestDecisionForWaitingReview(
  instanceId: string,
  nodeId: string,
  nodes: Array<{ id: string; nodeKey?: string; nodeName?: string }>
): Promise<WorkflowSupervisorDecision> {
  const node = nodes.find((n) => n.id === nodeId)
  const nodeName = node?.nodeName ?? node?.nodeKey ?? '未知节点'
  return createDecision({
    workflowInstanceId: instanceId,
    workflowInstanceNodeId: nodeId,
    decisionType: 'manual_review',
    reason: `Node ${node?.nodeKey} is waiting for human review`,
    reasonZh: `节点「${nodeName}」等待人工审核。请审核通过后继续流程。`,
    suggestedNextAction: '完成人工审核后，标记审核通过以继续流程',
  })
}

function suggestDecisionForPaused(instanceId: string): Promise<WorkflowSupervisorDecision> {
  return createDecision({
    workflowInstanceId: instanceId,
    decisionType: 'continue_workflow',
    reason: 'Workflow is paused/canceled',
    reasonZh: '流程已暂停。可选择继续执行或正式中止。',
    suggestedNextAction: '点击「继续执行」恢复流程，或「中止流程」正式结束',
  })
}

function suggestNoAction(
  instanceId: string,
  reasonZh: string
): Promise<WorkflowSupervisorDecision> {
  return createDecision({
    workflowInstanceId: instanceId,
    decisionType: 'no_action',
    reason: reasonZh,
    reasonZh,
    suggestedNextAction: '无需操作。如遇异常可手动介入。',
  })
}

/** 列出实例下的监督决策 */
export async function listSupervisorDecisions(
  instanceId: string
): Promise<WorkflowSupervisorDecision[]> {
  try {
    const res = await workflowSupervisorDecisionRepo.fetchSupervisorDecisions(instanceId)
    if (res.code !== 0 || !res.data) return []
    return res.data
  } catch {
    return []
  }
}

/** 应用监督决策：根据 decisionType 执行对应操作并写 API */
export async function applySupervisorDecision(decisionId: string): Promise<void> {
  const res = await workflowSupervisorDecisionRepo.fetchSupervisorDecisionById(decisionId)
  if (res.code !== 0 || !res.data) throw new Error('监督决策不存在')
  const d = res.data
  if (d.status !== 'suggested') throw new Error('仅建议中的决策可应用')

  const workflowInstanceId = d.workflowInstanceId
  const workflowInstanceNodeId = d.workflowInstanceNodeId ?? undefined

  switch (d.decisionType) {
    case 'retry':
      if (workflowInstanceNodeId) {
        const nodesRes = await workflowInstanceNodeRepo.fetchNodesByInstanceId(workflowInstanceId)
        const nodes = (nodesRes.code === 0 && nodesRes.data ? nodesRes.data : []) as Array<{
          id: string
          retryCount?: number
        }>
        const node = nodes.find((n) => n.id === workflowInstanceNodeId)
        const nextRetry = (node?.retryCount ?? 0) + 1
        await workflowInstanceNodeRepo.updateNode(workflowInstanceNodeId, {
          retryCount: nextRetry,
          lastRecoveryAction: 'manual_retry',
          recoveryStatus: 'retrying',
        })
        await appendLog(
          workflowInstanceId,
          'node_retry_started',
          `节点手动重试（第 ${nextRetry} 次）`,
          workflowInstanceNodeId
        )
        await retryNode(workflowInstanceId, workflowInstanceNodeId)
        await appendLog(workflowInstanceId, 'node_retry_completed', '节点重试完成', workflowInstanceNodeId)
      }
      break
    case 'skip':
      if (workflowInstanceNodeId) await skipNode(workflowInstanceId, workflowInstanceNodeId)
      break
    case 'manual_review':
    case 'continue_workflow':
      if (workflowInstanceNodeId) {
        const nodesRes = await workflowInstanceNodeRepo.fetchNodesByInstanceId(workflowInstanceId)
        const nodes = (nodesRes.code === 0 && nodesRes.data ? nodesRes.data : []) as Array<{ id: string; status: string }>
        const node = nodes.find((n) => n.id === workflowInstanceNodeId)
        if (node?.status === 'waiting_review') await approveReview(workflowInstanceId, workflowInstanceNodeId)
        else await continueWorkflow(workflowInstanceId)
      } else {
        await continueWorkflow(workflowInstanceId)
      }
      break
    case 'abort_workflow':
    case 'pause_workflow':
      await abortWorkflow(workflowInstanceId)
      await appendLog(workflowInstanceId, 'recovery_aborted', '流程已中止', workflowInstanceNodeId)
      break
    case 'no_action':
      break
    case 'replace_agent':
    case 'replace_skill':
    case 'restart_previous_node': {
      const { applyRecoveryDecision } = await import('./workflowSupervisorRecoveryService')
      await applyRecoveryDecision(decisionId)
      return
    }
    default:
      throw new Error(`不支持的决策类型：${d.decisionType}`)
  }

  await workflowSupervisorDecisionRepo.updateDecisionStatus(decisionId, 'applied')
  await appendLog(
    workflowInstanceId,
    'manual_continue',
    `应用监督建议：${d.reason}（决策类型：${d.decisionType}）`,
    workflowInstanceNodeId
  )
}

/** 忽略监督决策 */
export async function dismissSupervisorDecision(decisionId: string): Promise<void> {
  const res = await workflowSupervisorDecisionRepo.fetchSupervisorDecisionById(decisionId)
  if (res.code !== 0 || !res.data) throw new Error('监督决策不存在')
  const d = res.data as { status: string }
  if (d.status !== 'suggested') throw new Error('仅建议中的决策可忽略')
  await workflowSupervisorDecisionRepo.updateDecisionStatus(decisionId, 'dismissed')
}
