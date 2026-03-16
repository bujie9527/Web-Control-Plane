/**
 * 流程实例节点执行器（P1-A）
 * 根据节点 executionType 分发：agent_task → LLM；publish → Terminal
 */
import { executeLLMServer } from '../llm/llmExecutorServer'
import * as instanceDb from './workflowInstanceDb'
import * as templateDb from './workflowTemplateDb'

export interface NodeExecutionResult {
  success: boolean
  resultSummary?: string
  workerOutputJson?: Record<string, unknown>
  errorSummary?: string
  nextStatus: string
}

async function writeExecutionLog(
  instanceId: string,
  eventType: string,
  messageZh: string,
  nodeId?: string
): Promise<void> {
  try {
    const logDb = await import('./workflowRuntimeLogDb')
    await logDb.dbAppendRuntimeLog({
      instanceId,
      nodeId,
      eventType,
      messageZh,
    })
  } catch {
    // 日志写入失败不阻断执行
  }
}

/**
 * 执行流程实例的单个节点
 * @returns 更新后的实例节点（含 status、resultSummary、errorSummary）
 */
export async function executeInstanceNode(
  instanceId: string,
  nodeId: string
): Promise<ReturnType<typeof instanceDb.dbUpdateInstanceNode> | null> {
  const instance = await instanceDb.dbGetInstanceById(instanceId)
  if (!instance) return null

  const nodeRow = await instanceDb.dbGetInstanceNodeById(nodeId)
  const nodeInstanceId = (nodeRow as { workflowInstanceId?: string })?.workflowInstanceId
  if (!nodeRow || nodeInstanceId !== instanceId) {
    return null
  }

  const node = nodeRow as {
    id: string
    workflowInstanceId: string
    templateNodeId?: string
    key: string
    name: string
    status: string
    resultSummary?: string
    errorSummary?: string
  }

  if (node.status === 'running') {
    throw new Error('该节点正在执行中，请勿重复触发')
  }

  await instanceDb.dbUpdateInstanceNode(node.id, { status: 'running' })
  await writeExecutionLog(instanceId, 'node_started', `开始执行节点：${node.name}`, node.id)

  let result: NodeExecutionResult
  let templateNode: Awaited<ReturnType<typeof templateDb.dbGetTemplateNodeById>> = null
  if (node.templateNodeId) {
    templateNode = await templateDb.dbGetTemplateNodeById(node.templateNodeId)
  }

  const executionType = (templateNode as { executionType?: string } | null)?.executionType ?? 'agent_task'
  const recommendedAgentId = (templateNode as { recommendedAgentTemplateId?: string } | null)?.recommendedAgentTemplateId

  try {
    if (executionType === 'agent_task') {
      result = await executeAgentNode(node, recommendedAgentId)
    } else if (executionType === 'result_writer' || executionType === 'human_review') {
      result = { success: true, nextStatus: 'completed', resultSummary: '已跳过（需人工或终端执行）' }
    } else {
      result = { success: true, nextStatus: 'completed', resultSummary: `执行类型 ${executionType} 已占位处理` }
    }
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : '执行异常'
    result = {
      success: false,
      nextStatus: 'failed',
      errorSummary: errMsg,
    }
    await writeExecutionLog(instanceId, 'node_failed', `节点执行失败：${errMsg}`, node.id)
  }

  const updated = await instanceDb.dbUpdateInstanceNode(node.id, {
    status: result.nextStatus,
    resultSummary: result.resultSummary,
    errorSummary: result.errorSummary,
    workerOutputJson: result.workerOutputJson,
  })

  if (result.success) {
    await writeExecutionLog(instanceId, 'node_completed', `节点已完成：${node.name}`, node.id)
  }

  return updated
}

async function executeAgentNode(
  node: { name: string },
  agentTemplateId?: string | null
): Promise<NodeExecutionResult> {
  const userPrompt = `请作为流程节点执行者，完成以下节点任务并简要总结结果（中文）。\n节点名称：${node.name}\n输出一段简短的结果摘要即可。`
  const result = await executeLLMServer({
    agentTemplateId: agentTemplateId ?? undefined,
    userPrompt,
    outputMode: 'none',
  })

  if (!result.success) {
    return {
      success: false,
      nextStatus: 'failed',
      errorSummary: result.errorMessageZh ?? result.errorMessage ?? 'LLM 执行失败',
    }
  }

  return {
    success: true,
    nextStatus: 'completed',
    resultSummary: result.rawText?.slice(0, 500) ?? '执行完成',
    workerOutputJson: result.parsedJson ? { text: result.rawText, parsed: result.parsedJson } : undefined,
  }
}
