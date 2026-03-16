/**
 * 流程实例节点执行器（P1-A）
 * 根据节点 executionType 分发：agent_task → LLM；publish → Terminal
 */
import { executeLLMServer } from '../llm/llmExecutorServer'
import * as instanceDb from './workflowInstanceDb'
import * as templateDb from './workflowTemplateDb'
import { executeSkillsForNode } from './skillExecutionEngine'

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

function getValueByPath(source: Record<string, unknown>, pathExpr: string): unknown {
  const segments = pathExpr.split('.').filter(Boolean)
  let current: unknown = source
  for (const seg of segments) {
    if (current && typeof current === 'object' && seg in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[seg]
      continue
    }
    return undefined
  }
  return current
}

function resolveTemplateValue(
  raw: unknown,
  scope: Record<string, unknown>
): unknown {
  if (typeof raw === 'string') {
    const m = raw.match(/^\{\{\s*([^}]+)\s*\}\}$/)
    if (!m) return raw
    return getValueByPath(scope, m[1].trim())
  }
  if (Array.isArray(raw)) return raw.map((v) => resolveTemplateValue(v, scope))
  if (raw && typeof raw === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      out[k] = resolveTemplateValue(v, scope)
    }
    return out
  }
  return raw
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
    selectedAgentTemplateId?: string
    channelType?: string
    selectedSkillIds?: string[]
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
  const templateNodeKey = (templateNode as { key?: string } | null)?.key
  const inputMapping = (templateNode as { inputMapping?: Record<string, unknown> } | null)?.inputMapping
  const selectedAgentTemplateId = (node as { selectedAgentTemplateId?: string }).selectedAgentTemplateId
  const allowedSkillIds =
    ((templateNode as { allowedSkillIds?: string[] } | null)?.allowedSkillIds ?? []).filter(Boolean)
  const selectedSkillIds = Array.isArray(node.selectedSkillIds) ? node.selectedSkillIds : []
  const skillIdsToRun = selectedSkillIds.length ? selectedSkillIds : allowedSkillIds

  const allNodes = await instanceDb.dbListInstanceNodes(instanceId)
  const completedNodes = allNodes.filter((n) => n.status === 'completed')
  const completedNodeMap: Record<string, unknown> = {}
  for (const n of completedNodes) {
    completedNodeMap[n.key] = {
      nodeId: n.id,
      resultSummary: n.resultSummary,
      workerOutputJson: n.workerOutputJson,
    }
  }
  const runtimeScope = {
    instance: {
      id: instanceId,
      projectId: (instance as { projectId?: string }).projectId,
      currentNodeId: node.id,
      currentNodeKey: templateNodeKey ?? node.key,
    },
    project: {
      id: (instance as { projectId?: string }).projectId,
    },
    node: {
      id: node.id,
      key: templateNodeKey ?? node.key,
      name: node.name,
    },
    nodes: completedNodeMap,
  } as Record<string, unknown>
  const runtimeInput =
    inputMapping && typeof inputMapping === 'object'
      ? (resolveTemplateValue(inputMapping, runtimeScope) as Record<string, unknown>)
      : {}

  try {
    if (executionType === 'agent_task') {
      if (skillIdsToRun.length > 0) {
        const skillResult = await executeSkillsForNode({
          skillIds: skillIdsToRun,
          runtime: {
            instanceId,
            nodeId: node.id,
            nodeName: node.name,
            agentTemplateId: selectedAgentTemplateId ?? recommendedAgentId ?? undefined,
            executionType,
            runtimeInput,
            runtimeContext: {
              projectId: (instance as { projectId?: string }).projectId,
              channelType: (node as { channelType?: string }).channelType,
              instanceId,
              nodeId: node.id,
            },
          },
        })
        if (!skillResult.success) {
          result = {
            success: false,
            nextStatus: 'failed',
            errorSummary: skillResult.errorMessageZh ?? 'Skill 执行失败',
            workerOutputJson: {
              skills: skillResult.output,
            },
          }
        } else {
          const firstPromptMeta = Object.values(skillResult.output).find(
            (v) =>
              typeof v === 'object' &&
              v !== null &&
              'promptMeta' in (v as Record<string, unknown>)
          ) as { promptMeta?: { channelType?: string; channelStyleApplied?: Record<string, unknown> } } | undefined

          result = {
            success: true,
            nextStatus: 'completed',
            resultSummary: `Skill 执行完成（${skillIdsToRun.length} 个）`,
            workerOutputJson: {
              skills: skillResult.output,
              skillExecutionLog: skillResult.skillExecutionLog,
              channelType: firstPromptMeta?.promptMeta?.channelType,
              channelStyleApplied: firstPromptMeta?.promptMeta?.channelStyleApplied,
            },
          }
        }
      } else {
        result = await executeAgentNode(node, recommendedAgentId)
      }
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
    selectedSkillIds: skillIdsToRun,
    skillExecutionLog:
      result.workerOutputJson &&
      typeof result.workerOutputJson === 'object' &&
      'skillExecutionLog' in result.workerOutputJson
        ? (result.workerOutputJson as { skillExecutionLog?: unknown }).skillExecutionLog
        : undefined,
    channelType:
      result.workerOutputJson &&
      typeof result.workerOutputJson === 'object' &&
      'channelType' in result.workerOutputJson
        ? ((result.workerOutputJson as { channelType?: unknown }).channelType
            ? String((result.workerOutputJson as { channelType?: unknown }).channelType)
            : undefined)
        : undefined,
    channelStyleApplied:
      result.workerOutputJson &&
      typeof result.workerOutputJson === 'object' &&
      'channelStyleApplied' in result.workerOutputJson
        ? (result.workerOutputJson as { channelStyleApplied?: unknown }).channelStyleApplied
        : undefined,
  })

  if (result.success) {
    await writeExecutionLog(instanceId, 'node_completed', `节点已完成：${node.name}`, node.id)
  }

  return updated
}

export async function executeInstanceSequential(instanceId: string): Promise<{
  success: boolean
  executedNodeIds: string[]
  failedNodeId?: string
  errorMessage?: string
}> {
  const nodes = await instanceDb.dbListInstanceNodes(instanceId)
  const executedNodeIds: string[] = []
  for (const n of nodes) {
    if (n.status === 'completed') continue
    const updated = await executeInstanceNode(instanceId, n.id)
    if (!updated) {
      return { success: false, executedNodeIds, failedNodeId: n.id, errorMessage: '节点不存在或实例不匹配' }
    }
    executedNodeIds.push(n.id)
    if (updated.status === 'failed') {
      return {
        success: false,
        executedNodeIds,
        failedNodeId: n.id,
        errorMessage: updated.errorSummary ?? '节点执行失败',
      }
    }
  }
  return { success: true, executedNodeIds }
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
