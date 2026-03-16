/**
 * Worker Agent 执行服务（Phase 17 / Phase C）
 * WorkflowInstanceNode → Worker AgentTemplate → Adapter → LLM → Parser → Runtime（真实 API）
 */
import type { WorkflowRuntimeEventType } from '../schemas/workflowRuntime'
import * as workflowInstanceRepo from '../repositories/workflowInstanceRepository'
import * as workflowInstanceNodeRepo from '../repositories/workflowInstanceNodeRepository'
import * as workflowTemplateNodeRepo from '../repositories/workflowTemplateNodeRepository'
import * as workflowRuntimeLogRepo from '../repositories/workflowRuntimeLogRepository'
import { runContentCreatorLLM } from './adapters/contentCreatorLLMAdapter'
import { runContentReviewerLLM } from './adapters/contentReviewerLLMAdapter'

const CONTENT_CREATOR_AGENT_IDS = ['at-base-content-creator', 'at-facebook-content-creator']
const CONTENT_REVIEWER_AGENT_IDS = ['at-content-reviewer']

export interface ExecuteWorkerNodeResult {
  success: boolean
  errorCode?: string
  errorMessage?: string
  errorMessageZh?: string
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
    // 日志写入失败不阻断主流程
  }
}

/**
 * 执行 Worker 节点（Content Creator / Content Reviewer）
 * 调用真实 LLM，解析输出，写入真实 API（Runtime 节点 + 运行日志）
 */
export async function executeWorkerNode(
  instanceId: string,
  nodeId: string
): Promise<ExecuteWorkerNodeResult> {
  let instance: { workflowTemplateId?: string; templateId?: string; sourceSummary?: string } | null =
    null
  try {
    const res = await workflowInstanceRepo.fetchInstanceDetail(instanceId)
    if (res.code !== 0 || !res.data) {
      return {
        success: false,
        errorCode: 'INSTANCE_NOT_FOUND',
        errorMessageZh: '流程实例不存在',
      }
    }
    instance = res.data as { workflowTemplateId?: string; templateId?: string; sourceSummary?: string }
  } catch {
    return {
      success: false,
      errorCode: 'INSTANCE_NOT_FOUND',
      errorMessageZh: '流程实例不存在',
    }
  }

  let nodes: Array<{
    id: string
    templateNodeId?: string
    nodeKey?: string
    key?: string
    selectedAgentTemplateId?: string
    nodeName?: string
    name?: string
    resultSummary?: string
    workerOutputJson?: { content?: string }
    orderIndex?: number
  }> = []
  try {
    const nodesRes = await workflowInstanceNodeRepo.fetchNodesByInstanceId(instanceId)
    if (nodesRes.code === 0 && nodesRes.data) nodes = nodesRes.data as typeof nodes
  } catch {
    return {
      success: false,
      errorCode: 'NODE_LIST_FAILED',
      errorMessageZh: '获取节点列表失败',
    }
  }

  const node = nodes.find((n) => n.id === nodeId) ?? null
  if (!node) {
    return {
      success: false,
      errorCode: 'NODE_NOT_FOUND',
      errorMessageZh: '节点不存在',
    }
  }

  const templateId = (instance as { templateId?: string }).templateId ?? instance.workflowTemplateId
  if (!templateId) {
    return {
      success: false,
      errorCode: 'TEMPLATE_NOT_FOUND',
      errorMessageZh: '模板不存在',
    }
  }

  let templateNodes: Array<{ id: string; key?: string; nodeKey?: string; recommendedAgentTemplateId?: string; agentTemplateId?: string; orderIndex?: number }> = []
  try {
    const tnRes = await workflowTemplateNodeRepo.fetchNodesByTemplateId(templateId)
    if (tnRes.code === 0 && tnRes.data) templateNodes = tnRes.data as typeof templateNodes
  } catch {
    // 模板节点获取失败时继续，agentId 可能来自 node.selectedAgentTemplateId
  }

  const templateNode = templateNodes.find(
    (t) => t.id === node.templateNodeId || (t.key ?? t.nodeKey) === (node.nodeKey ?? node.key)
  )
  const agentId =
    node.selectedAgentTemplateId ??
    templateNode?.recommendedAgentTemplateId ??
    (templateNode as { agentTemplateId?: string })?.agentTemplateId

  if (!agentId) {
    return {
      success: false,
      errorCode: 'AGENT_NOT_BOUND',
      errorMessageZh: '节点未绑定 Agent 模板',
    }
  }

  const nodeName = node.nodeName ?? node.name ?? node.nodeKey ?? '未知节点'
  await appendLog(instanceId, 'worker_llm_execution_started', `Worker AI 开始执行：${nodeName}`, nodeId)

  if (CONTENT_CREATOR_AGENT_IDS.includes(agentId)) {
    return _executeContentCreator(instanceId, nodeId, instance, node, agentId, nodeName)
  }
  if (CONTENT_REVIEWER_AGENT_IDS.includes(agentId)) {
    return _executeContentReviewer(instanceId, nodeId, instance, nodes, templateNodes, agentId, nodeName)
  }

  await appendLog(instanceId, 'worker_llm_execution_failed', `不支持的 Worker Agent：${agentId}`, nodeId)
  try {
    await workflowInstanceNodeRepo.updateNode(nodeId, { status: 'failed' })
  } catch {
    // ignore
  }
  return {
    success: false,
    errorCode: 'UNSUPPORTED_WORKER',
    errorMessageZh: `不支持的 Worker Agent：${agentId}`,
  }
}

async function _executeContentCreator(
  instanceId: string,
  nodeId: string,
  instance: { sourceSummary?: string },
  node: { nodeName?: string; name?: string; nodeKey?: string },
  agentId: string,
  nodeName: string
): Promise<ExecuteWorkerNodeResult> {
  const goal = instance.sourceSummary ?? '生成社媒内容'
  const topic = node.nodeName ?? node.name ?? node.nodeKey ?? '通用'
  const result = await runContentCreatorLLM({ agentTemplateId: agentId, goal, topic })

  if (!result.ok) {
    await appendLog(
      instanceId,
      'worker_llm_execution_failed',
      `Worker AI 执行失败：${result.errorMessageZh}`,
      nodeId
    )
    try {
      await workflowInstanceNodeRepo.updateNode(nodeId, {
        status: 'failed',
        errorSummary: result.errorMessageZh,
      })
    } catch {
      // ignore
    }
    return {
      success: false,
      errorCode: result.errorCode,
      errorMessage: result.errorMessage,
      errorMessageZh: result.errorMessageZh,
    }
  }

  const summaryText = `${result.data.summary}${result.data.tags.length ? ` | 标签：${result.data.tags.join('、')}` : ''}`
  try {
    await workflowInstanceNodeRepo.updateNode(nodeId, {
      resultSummary: summaryText,
      workerOutputJson: {
        content: result.data.content,
        summary: result.data.summary,
        tags: result.data.tags,
        notes: result.data.notes,
      },
      workerExecutionModel: result.modelKey,
      workerExecutionDurationMs: result.latencyMs,
      workerExecutionAgentId: agentId,
      status: 'completed',
    })
  } catch {
    return {
      success: false,
      errorCode: 'WRITE_FAILED',
      errorMessageZh: '节点结果写入失败',
    }
  }

  await appendLog(
    instanceId,
    'worker_llm_execution_completed',
    `Worker AI 执行完成：${nodeName}（耗时 ${result.latencyMs}ms）`,
    nodeId
  )
  return { success: true }
}

async function _executeContentReviewer(
  instanceId: string,
  nodeId: string,
  _instance: { sourceSummary?: string; templateId?: string; workflowTemplateId?: string },
  nodes: Array<{
    id: string
    templateNodeId?: string
    nodeKey?: string
    key?: string
    resultSummary?: string
    workerOutputJson?: { content?: string }
    orderIndex?: number
  }>,
  templateNodes: Array<{ id: string; key?: string; nodeKey?: string; orderIndex?: number }>,
  agentId: string,
  nodeName: string
): Promise<ExecuteWorkerNodeResult> {
  const sorted = [...nodes].sort((a, b) => {
    const oa =
      templateNodes.find((t) => t.id === a.templateNodeId || (t.key ?? t.nodeKey) === (a.nodeKey ?? a.key))
        ?.orderIndex ?? 999
    const ob =
      templateNodes.find((t) => t.id === b.templateNodeId || (t.key ?? t.nodeKey) === (b.nodeKey ?? b.key))
        ?.orderIndex ?? 999
    return oa - ob
  })
  const idx = sorted.findIndex((n) => n.id === nodeId)
  const prevNode = idx > 0 ? sorted[idx - 1] : null
  const contentToReview =
    prevNode?.resultSummary ?? prevNode?.workerOutputJson?.content ?? '（无上一节点内容）'
  const content =
    typeof prevNode?.workerOutputJson?.content === 'string'
      ? prevNode.workerOutputJson.content
      : contentToReview

  const result = await runContentReviewerLLM({
    agentTemplateId: agentId,
    content: typeof content === 'string' ? content : String(content ?? '（无上一节点内容）'),
  })

  if (!result.ok) {
    await appendLog(
      instanceId,
      'worker_llm_execution_failed',
      `Worker AI 执行失败：${typeof result.errorMessageZh === 'string' ? result.errorMessageZh : '未知错误'}`,
      nodeId
    )
    try {
      await workflowInstanceNodeRepo.updateNode(nodeId, {
        status: 'failed',
        errorSummary: String(result.errorMessageZh ?? 'Worker AI 执行失败'),
      })
    } catch {
      // ignore
    }
    return {
      success: false,
      errorCode: result.errorCode,
      errorMessage: result.errorMessage,
      errorMessageZh: result.errorMessageZh,
    }
  }

  const summaryStr = typeof result.data.summary === 'string' ? result.data.summary : ''
  const reviewSummaryText = `${result.data.reviewResult === 'approved' ? '审核通过' : '需修订'}${summaryStr ? `。${summaryStr}` : ''}`
  try {
    await workflowInstanceNodeRepo.updateNode(nodeId, {
      reviewSummary: reviewSummaryText,
      workerOutputJson: {
        reviewResult: result.data.reviewResult,
        issues: result.data.issues,
        suggestions: result.data.suggestions,
        summary: summaryStr,
      },
      workerExecutionModel: result.modelKey,
      workerExecutionDurationMs: result.latencyMs,
      workerExecutionAgentId: agentId,
      status: 'completed',
    })
  } catch {
    return {
      success: false,
      errorCode: 'WRITE_FAILED',
      errorMessageZh: '节点结果写入失败',
    }
  }

  await appendLog(
    instanceId,
    'worker_llm_execution_completed',
    `Worker AI 执行完成：${nodeName}（${result.data.reviewResult}，耗时 ${result.latencyMs}ms）`,
    nodeId
  )
  return { success: true }
}
