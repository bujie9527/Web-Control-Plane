/**
 * 流程监督恢复服务（Phase 16 / Phase C）
 * 基于节点策略生成恢复建议并执行恢复动作；读写走真实 API
 * 注：不依赖 workflowSupervisorService 的 createDecision，避免循环依赖；直接调 repo 并映射为执行层决策。
 */
import type { WorkflowSupervisorDecision } from '../schemas/workflowExecution'
import type { WorkflowRuntimeEventType, SupervisorDecisionType } from '../schemas/workflowRuntime'
import * as workflowInstanceRepo from '../repositories/workflowInstanceRepository'
import * as workflowInstanceNodeRepo from '../repositories/workflowInstanceNodeRepository'
import * as workflowTemplateNodeRepo from '../repositories/workflowTemplateNodeRepository'
import * as workflowSupervisorDecisionRepo from '../repositories/workflowSupervisorDecisionRepository'
import * as workflowRuntimeLogRepo from '../repositories/workflowRuntimeLogRepository'
import { retryNode } from './workflowRuntimeService'

/** 创建监督决策（写 API，返回执行层形状），避免循环依赖 workflowSupervisorService */
async function createRecoveryDecision(payload: {
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
  if (res.code !== 0 || !res.data) throw new Error('创建监督决策失败')
  return res.data
}

export interface RecoveryAnalysisResult {
  nodeId: string
  instanceId: string
  decision: WorkflowSupervisorDecision | null
  reasonZh: string
  canAutoRetry: boolean
  canReplaceAgent: boolean
  canReplaceSkill: boolean
}

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

/** 分析节点恢复策略，基于模板策略生成建议 */
export async function analyzeRecoveryForNode(
  instanceId: string,
  nodeId: string
): Promise<RecoveryAnalysisResult> {
  let instance: { templateId?: string; workflowTemplateId?: string } | null = null
  let nodes: Array<{
    id: string
    status: string
    templateNodeId?: string
    nodeKey?: string
    nodeName?: string
    name?: string
    errorSummary?: string
    retryCount?: number
    lastErrorSummary?: string
  }> = []
  let templateNodes: Array<{
    id: string
    orderIndex?: number
    retryPolicy?: { enabled?: boolean; maxRetryCount?: number; retryStrategy?: string; autoRetryEnabled?: boolean }
    fallbackAgentTemplateIds?: string[]
    fallbackSkillIds?: string[]
    supervisorPolicy?: { allowManualReview?: boolean; allowAbortWorkflow?: boolean; allowRestartPreviousNode?: boolean }
    allowedSkillIds?: string[]
  }> = []

  try {
    const instRes = await workflowInstanceRepo.fetchInstanceDetail(instanceId)
    if (instRes.code !== 0 || !instRes.data) {
      return { nodeId, instanceId, decision: null, reasonZh: '实例不存在', canAutoRetry: false, canReplaceAgent: false, canReplaceSkill: false }
    }
    instance = instRes.data as { templateId?: string; workflowTemplateId?: string }
    const nodesRes = await workflowInstanceNodeRepo.fetchNodesByInstanceId(instanceId)
    if (nodesRes.code === 0 && nodesRes.data) nodes = nodesRes.data as typeof nodes
    const templateId = instance.templateId ?? instance.workflowTemplateId
    if (templateId) {
      const tnRes = await workflowTemplateNodeRepo.fetchNodesByTemplateId(templateId)
      if (tnRes.code === 0 && tnRes.data) templateNodes = tnRes.data as typeof templateNodes
    }
  } catch {
    return { nodeId, instanceId, decision: null, reasonZh: '实例不存在', canAutoRetry: false, canReplaceAgent: false, canReplaceSkill: false }
  }

  const node = nodes.find((n) => n.id === nodeId) ?? null
  if (!node) {
    return { nodeId, instanceId, decision: null, reasonZh: '节点不存在', canAutoRetry: false, canReplaceAgent: false, canReplaceSkill: false }
  }

  const templateId = instance?.templateId ?? instance?.workflowTemplateId
  if (!templateId) {
    return { nodeId, instanceId, decision: null, reasonZh: '模板不存在', canAutoRetry: false, canReplaceAgent: false, canReplaceSkill: false }
  }

  const templateNode = templateNodes.find((t) => t.id === node.templateNodeId)
  const nodeName = node.nodeName ?? node.name ?? node.nodeKey ?? '未知节点'

  if (node.status !== 'failed' && node.status !== 'waiting_review') {
    return {
      nodeId,
      instanceId,
      decision: null,
      reasonZh: `节点「${nodeName}」状态为 ${node.status}，暂无需恢复`,
      canAutoRetry: false,
      canReplaceAgent: false,
      canReplaceSkill: false,
    }
  }

  const retryPolicy = templateNode?.retryPolicy
  const fallbackAgentIds = templateNode?.fallbackAgentTemplateIds ?? []
  const fallbackSkillIds = templateNode?.fallbackSkillIds ?? []
  const supervisorPolicy = templateNode?.supervisorPolicy
  const retryCount = node.retryCount ?? 0
  const maxRetry = retryPolicy?.maxRetryCount ?? 0
  const canRetry = retryPolicy?.enabled && retryCount < maxRetry
  const canReplaceAgent = fallbackAgentIds.length > 0
  const canReplaceSkill = fallbackSkillIds.length > 0
  const autoRetryAllowed = retryPolicy?.autoRetryEnabled ?? false

  if (node.status === 'failed') {
    if (canRetry && retryPolicy?.retryStrategy === 'same_agent') {
      const decision = await createRecoveryDecision({
        workflowInstanceId: instanceId,
        workflowInstanceNodeId: nodeId,
        decisionType: 'retry',
        reason: `Node ${node.nodeKey} failed, retry allowed (${retryCount}/${maxRetry})`,
        reasonZh: `节点「${nodeName}」执行失败。允许重试（已重试 ${retryCount}/${maxRetry} 次）。`,
        suggestedNextAction: autoRetryAllowed ? '可自动重试一次' : '建议手动重试',
        relatedErrorSummary: node.errorSummary ?? node.lastErrorSummary,
      })
      return {
        nodeId,
        instanceId,
        decision,
        reasonZh: decision.reasonZh,
        canAutoRetry: autoRetryAllowed,
        canReplaceAgent: false,
        canReplaceSkill: false,
      }
    }
    if (retryCount >= maxRetry && canReplaceAgent) {
      const decision = await createRecoveryDecision({
        workflowInstanceId: instanceId,
        workflowInstanceNodeId: nodeId,
        decisionType: 'replace_agent',
        reason: `Node ${node.nodeKey} retry limit reached, suggest fallback agent`,
        reasonZh: `节点「${nodeName}」重试已达上限。建议切换备用 Agent：${fallbackAgentIds.slice(0, 2).join('、')}`,
        suggestedNextAction: '点击「手动切换备用 Agent」或应用建议',
        relatedErrorSummary: node.errorSummary ?? node.lastErrorSummary,
      })
      return {
        nodeId,
        instanceId,
        decision,
        reasonZh: decision.reasonZh,
        canAutoRetry: false,
        canReplaceAgent: true,
        canReplaceSkill: false,
      }
    }
    if (canReplaceSkill) {
      const decision = await createRecoveryDecision({
        workflowInstanceId: instanceId,
        workflowInstanceNodeId: nodeId,
        decisionType: 'replace_skill',
        reason: `Node ${node.nodeKey} failed, suggest fallback skill`,
        reasonZh: `节点「${nodeName}」执行失败。建议切换备用 Skill：${fallbackSkillIds.slice(0, 2).join('、')}`,
        suggestedNextAction: '点击「手动切换备用 Skill」或应用建议',
        relatedErrorSummary: node.errorSummary ?? node.lastErrorSummary,
      })
      return {
        nodeId,
        instanceId,
        decision,
        reasonZh: decision.reasonZh,
        canAutoRetry: false,
        canReplaceAgent: false,
        canReplaceSkill: true,
      }
    }
    const allowManualReview = supervisorPolicy?.allowManualReview ?? true
    const allowAbort = supervisorPolicy?.allowAbortWorkflow ?? true
    const decision = await createRecoveryDecision({
      workflowInstanceId: instanceId,
      workflowInstanceNodeId: nodeId,
      decisionType: allowManualReview ? 'manual_review' : allowAbort ? 'abort_workflow' : 'no_action',
      reason: `Node ${node.nodeKey} failed, no recovery policy available`,
      reasonZh: `节点「${nodeName}」执行失败。无可用恢复策略，建议人工审核或中止流程。`,
      suggestedNextAction: allowManualReview ? '建议人工审核' : allowAbort ? '建议中止流程' : '暂无建议',
      relatedErrorSummary: node.errorSummary ?? node.lastErrorSummary,
    })
    return {
      nodeId,
      instanceId,
      decision,
      reasonZh: decision.reasonZh,
      canAutoRetry: false,
      canReplaceAgent: false,
      canReplaceSkill: false,
    }
  }

  if (node.status === 'waiting_review') {
    const decision = await createRecoveryDecision({
      workflowInstanceId: instanceId,
      workflowInstanceNodeId: nodeId,
      decisionType: 'manual_review',
      reason: `Node ${node.nodeKey} is waiting for human review`,
      reasonZh: `节点「${nodeName}」等待人工审核。请审核通过后继续流程。`,
      suggestedNextAction: '完成人工审核后，标记审核通过以继续流程',
    })
    return {
      nodeId,
      instanceId,
      decision,
      reasonZh: decision.reasonZh,
      canAutoRetry: false,
      canReplaceAgent: false,
      canReplaceSkill: false,
    }
  }

  return {
    nodeId,
    instanceId,
    decision: null,
    reasonZh: '暂无需恢复',
    canAutoRetry: false,
    canReplaceAgent: false,
    canReplaceSkill: false,
  }
}

/** 为节点生成恢复建议（封装 analyzeRecoveryForNode，返回 decision） */
export async function suggestRecoveryDecision(
  instanceId: string,
  nodeId: string
): Promise<WorkflowSupervisorDecision | null> {
  const result = await analyzeRecoveryForNode(instanceId, nodeId)
  return result.decision
}

/** 应用恢复决策（复用 supervisor 的 apply，并补充 recovery 相关决策类型） */
export async function applyRecoveryDecision(decisionId: string): Promise<void> {
  const res = await workflowSupervisorDecisionRepo.fetchSupervisorDecisionById(decisionId)
  if (res.code !== 0 || !res.data) throw new Error('监督决策不存在')
  const decision = res.data
  if (decision.status !== 'suggested') throw new Error('仅建议中的决策可应用')

  const workflowInstanceId = decision.workflowInstanceId
  const workflowInstanceNodeId = decision.workflowInstanceNodeId ?? undefined

  const needsNodeId = ['replace_agent', 'replace_skill', 'restart_previous_node'].includes(decision.decisionType)
  if (needsNodeId && !workflowInstanceNodeId) {
    throw new Error('该决策缺少关联节点ID，无法应用')
  }

  if (decision.decisionType === 'replace_agent') {
    await switchToFallbackAgent(workflowInstanceId, workflowInstanceNodeId!)
    await workflowSupervisorDecisionRepo.updateDecisionStatus(decisionId, 'applied')
    return
  }
  if (decision.decisionType === 'replace_skill') {
    await switchToFallbackSkill(workflowInstanceId, workflowInstanceNodeId!)
    await workflowSupervisorDecisionRepo.updateDecisionStatus(decisionId, 'applied')
    return
  }
  if (decision.decisionType === 'restart_previous_node') {
    await restartPreviousNode(workflowInstanceId, workflowInstanceNodeId!)
    await workflowSupervisorDecisionRepo.updateDecisionStatus(decisionId, 'applied')
    return
  }

  const { applySupervisorDecision } = await import('./workflowSupervisorService')
  await applySupervisorDecision(decisionId)
}

/** 若策略允许则自动重试一次 */
export async function autoRetryIfAllowed(instanceId: string, nodeId: string): Promise<boolean> {
  const result = await analyzeRecoveryForNode(instanceId, nodeId)
  if (!result.canAutoRetry || result.decision?.decisionType !== 'retry') return false

  await appendLog(instanceId, 'node_retry_started', '节点自动重试开始', nodeId)
  await retryNode(instanceId, nodeId)
  let nodes: Array<{ id: string; retryCount?: number }> = []
  try {
    const nodesRes = await workflowInstanceNodeRepo.fetchNodesByInstanceId(instanceId)
    if (nodesRes.code === 0 && nodesRes.data) nodes = nodesRes.data as typeof nodes
  } catch {
    // ignore
  }
  const node = nodes.find((n) => n.id === nodeId)
  const retryCount = (node?.retryCount ?? 0) + 1
  try {
    await workflowInstanceNodeRepo.updateNode(nodeId, {
      retryCount,
      lastRecoveryAction: 'auto_retry',
      recoveryStatus: 'retrying',
    })
  } catch {
    // ignore
  }
  await appendLog(instanceId, 'node_retry_completed', `节点已自动重试（第 ${retryCount} 次）`, nodeId)
  if (result.decision) await workflowSupervisorDecisionRepo.updateDecisionStatus(result.decision.id, 'applied')
  return true
}

/** 切换到备用 Agent */
export async function switchToFallbackAgent(
  instanceId: string,
  nodeId: string,
  agentTemplateId?: string
): Promise<void> {
  const instRes = await workflowInstanceRepo.fetchInstanceDetail(instanceId)
  if (instRes.code !== 0 || !instRes.data) throw new Error('实例不存在')
  const instance = instRes.data as { templateId?: string; workflowTemplateId?: string }

  const nodesRes = await workflowInstanceNodeRepo.fetchNodesByInstanceId(instanceId)
  const nodes = (nodesRes.code === 0 && nodesRes.data ? nodesRes.data : []) as Array<{
    id: string
    templateNodeId?: string
  }>
  const node = nodes.find((n) => n.id === nodeId) ?? null
  if (!node) throw new Error('节点不存在')

  const templateId = instance.templateId ?? instance.workflowTemplateId
  if (!templateId) throw new Error('模板不存在')

  const tnRes = await workflowTemplateNodeRepo.fetchNodesByTemplateId(templateId)
  const templateNodes = (tnRes.code === 0 && tnRes.data ? tnRes.data : []) as Array<{
    id: string
    fallbackAgentTemplateIds?: string[]
  }>
  const templateNode = templateNodes.find((t) => t.id === node.templateNodeId)
  const fallbackIds = templateNode?.fallbackAgentTemplateIds ?? []
  if (fallbackIds.length === 0) throw new Error('该节点未配置备用 Agent')

  const targetId = agentTemplateId ?? fallbackIds[0]
  if (!fallbackIds.includes(targetId)) throw new Error('指定的 Agent 不在备用列表中')

  await workflowInstanceNodeRepo.updateNode(nodeId, {
    selectedAgentTemplateId: targetId,
    recoveryStatus: 'fallback_agent',
    lastRecoveryAction: `replace_agent:${targetId}`,
  })
  await appendLog(instanceId, 'fallback_agent_used', `已切换备用 Agent：${targetId}`, nodeId)
  await retryNode(instanceId, nodeId)
}

/** 切换到备用 Skill（仅更新恢复状态，selectedSkillIds 当前无 DB 字段） */
export async function switchToFallbackSkill(
  instanceId: string,
  nodeId: string,
  skillIds?: string[]
): Promise<void> {
  const instRes = await workflowInstanceRepo.fetchInstanceDetail(instanceId)
  if (instRes.code !== 0 || !instRes.data) throw new Error('实例不存在')
  const instance = instRes.data as { templateId?: string; workflowTemplateId?: string }

  const nodesRes = await workflowInstanceNodeRepo.fetchNodesByInstanceId(instanceId)
  const nodes = (nodesRes.code === 0 && nodesRes.data ? nodesRes.data : []) as Array<{
    id: string
    templateNodeId?: string
  }>
  const node = nodes.find((n) => n.id === nodeId) ?? null
  if (!node) throw new Error('节点不存在')

  const templateId = instance.templateId ?? instance.workflowTemplateId
  if (!templateId) throw new Error('模板不存在')

  const tnRes = await workflowTemplateNodeRepo.fetchNodesByTemplateId(templateId)
  const templateNodes = (tnRes.code === 0 && tnRes.data ? tnRes.data : []) as Array<{
    id: string
    fallbackSkillIds?: string[]
    allowedSkillIds?: string[]
  }>
  const templateNode = templateNodes.find((t) => t.id === node.templateNodeId)
  const fallbackIds = templateNode?.fallbackSkillIds ?? []
  if (fallbackIds.length === 0) throw new Error('该节点未配置备用 Skill')

  const targetIds = skillIds ?? fallbackIds
  const allowed = templateNode?.allowedSkillIds ?? []
  const valid = targetIds.every((s) => fallbackIds.includes(s) || allowed.includes(s))
  if (!valid) throw new Error('指定的 Skill 不在允许范围内')

  await workflowInstanceNodeRepo.updateNode(nodeId, {
    recoveryStatus: 'fallback_skill',
    lastRecoveryAction: `replace_skill:${targetIds.join(',')}`,
  })
  await appendLog(instanceId, 'fallback_skill_used', `已切换备用 Skill：${targetIds.join('、')}`, nodeId)
  await retryNode(instanceId, nodeId)
}

/** 回退到上一节点重新执行 */
export async function restartPreviousNode(instanceId: string, nodeId: string): Promise<void> {
  const instRes = await workflowInstanceRepo.fetchInstanceDetail(instanceId)
  if (instRes.code !== 0 || !instRes.data) throw new Error('实例不存在')
  const instance = instRes.data as { templateId?: string; workflowTemplateId?: string }

  const nodesRes = await workflowInstanceNodeRepo.fetchNodesByInstanceId(instanceId)
  const nodes = (nodesRes.code === 0 && nodesRes.data ? nodesRes.data : []) as Array<{
    id: string
    templateNodeId?: string
    nodeKey?: string
    nodeName?: string
  }>
  const templateId = instance.templateId ?? instance.workflowTemplateId
  if (!templateId) throw new Error('模板不存在')

  const tnRes = await workflowTemplateNodeRepo.fetchNodesByTemplateId(templateId)
  const templateNodes = (tnRes.code === 0 && tnRes.data ? tnRes.data : []) as Array<{
    id: string
    orderIndex?: number
    supervisorPolicy?: { allowRestartPreviousNode?: boolean }
  }>
  const currentNode = nodes.find((n) => n.id === nodeId)
  if (!currentNode) throw new Error('节点不存在')

  const tNode = templateNodes.find((t) => t.id === currentNode.templateNodeId)
  const allowRestart = tNode?.supervisorPolicy?.allowRestartPreviousNode ?? false
  if (!allowRestart) throw new Error('该节点不允许回退上一节点')

  const sorted = [...nodes].sort((a, b) => {
    const orderA = templateNodes.find((t) => t.id === a.templateNodeId)?.orderIndex ?? 999
    const orderB = templateNodes.find((t) => t.id === b.templateNodeId)?.orderIndex ?? 999
    return orderA - orderB
  })
  const idx = sorted.findIndex((n) => n.id === nodeId)
  if (idx <= 0) throw new Error('无上一节点可回退')
  const prevNode = sorted[idx - 1]

  await appendLog(
    instanceId,
    'restart_previous_node',
    `回退到上一节点「${prevNode.nodeName ?? prevNode.nodeKey}」重新执行`,
    nodeId
  )
  await workflowInstanceNodeRepo.updateNode(prevNode.id, { status: 'pending' })
}
