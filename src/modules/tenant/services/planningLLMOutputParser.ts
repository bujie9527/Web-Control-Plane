import type { WorkflowPlanningDraftNode } from '../schemas/workflowPlanningSession'
import type { AgentTemplateRoleType } from '@/modules/platform/schemas/agentTemplate'

export interface ParsedPlanningLLMOutput {
  summary?: string
  changeSummary?: string
  riskNotes?: string
  nodes: WorkflowPlanningDraftNode[]
  suggestedAgentTemplateIds?: string[]
  suggestedSkillIds?: string[]
  missingCapabilities?: string[]
  capabilityNotes?: string
}

export interface PlanningLLMParseError {
  code: 'JSON_EXTRACT_FAILED' | 'JSON_PARSE_FAILED' | 'SCHEMA_INVALID'
  message: string
  messageZh: string
}

function toNode(
  raw: Record<string, unknown>,
  idx: number,
  previousNodeId?: string
): WorkflowPlanningDraftNode | null {
  const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id : `wpn-llm-${Date.now()}-${idx + 1}`
  const key = typeof raw.key === 'string' ? raw.key.trim() : ''
  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  const executionType = raw.executionType
  const intentType = raw.intentType
  const orderIndex =
    typeof raw.orderIndex === 'number' && raw.orderIndex > 0 ? raw.orderIndex : idx + 1
  if (!key || !name || typeof executionType !== 'string' || typeof intentType !== 'string') return null

  const depends = Array.isArray(raw.dependsOnNodeIds)
    ? raw.dependsOnNodeIds.filter((x): x is string => typeof x === 'string')
    : previousNodeId
      ? [previousNodeId]
      : []

  return {
    id,
    key,
    name,
    description: typeof raw.description === 'string' ? raw.description : undefined,
    executionType: executionType as WorkflowPlanningDraftNode['executionType'],
    intentType: intentType as WorkflowPlanningDraftNode['intentType'],
    orderIndex,
    dependsOnNodeIds: depends,
    recommendedAgentTemplateId:
      typeof raw.recommendedAgentTemplateId === 'string' ? raw.recommendedAgentTemplateId : undefined,
    allowedAgentRoleTypes: Array.isArray(raw.allowedAgentRoleTypes)
      ? raw.allowedAgentRoleTypes.filter((x): x is AgentTemplateRoleType => typeof x === 'string')
      : undefined,
    allowedSkillIds: Array.isArray(raw.allowedSkillIds)
      ? raw.allowedSkillIds.filter((x): x is string => typeof x === 'string')
      : undefined,
  }
}

function extractJsonBlock(rawText: string): string | null {
  const fenced = rawText.match(/```json\s*([\s\S]*?)```/i)
  if (fenced?.[1]) return fenced[1].trim()
  const firstBrace = rawText.indexOf('{')
  const lastBrace = rawText.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) return rawText.slice(firstBrace, lastBrace + 1)
  return null
}

export function parsePlanningLLMOutput(
  rawText: string
): { ok: true; data: ParsedPlanningLLMOutput } | { ok: false; error: PlanningLLMParseError } {
  const jsonText = extractJsonBlock(rawText)
  if (!jsonText) {
    return {
      ok: false,
      error: {
        code: 'JSON_EXTRACT_FAILED',
        message: 'Failed to extract JSON block from model output',
        messageZh: '模型返回格式异常',
      },
    }
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch (e) {
    return {
      ok: false,
      error: {
        code: 'JSON_PARSE_FAILED',
        message: `JSON parse failed: ${(e as Error).message}`,
        messageZh: '模型返回格式异常',
      },
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      ok: false,
      error: {
        code: 'SCHEMA_INVALID',
        message: 'Parsed result is not an object',
        messageZh: '模型返回内容不是合法 JSON 对象',
      },
    }
  }

  const obj = parsed as Record<string, unknown>
  if (!Array.isArray(obj.nodes)) {
    return {
      ok: false,
      error: {
        code: 'SCHEMA_INVALID',
        message: 'nodes must be an array',
        messageZh: '模型返回草案缺少 nodes 字段',
      },
    }
  }
  const nodes: WorkflowPlanningDraftNode[] = []
  for (let i = 0; i < obj.nodes.length; i++) {
    const rawNode = obj.nodes[i]
    if (!rawNode || typeof rawNode !== 'object') {
      return {
        ok: false,
        error: {
          code: 'SCHEMA_INVALID',
          message: `node at index ${i} is invalid`,
          messageZh: `模型返回草案中节点 #${i + 1} 格式无效`,
        },
      }
    }
    const node = toNode(rawNode as Record<string, unknown>, i, nodes[i - 1]?.id)
    if (!node) {
      return {
        ok: false,
        error: {
          code: 'SCHEMA_INVALID',
          message: `node at index ${i} missing required fields`,
          messageZh: `模型返回草案中节点 #${i + 1} 缺少必要字段（key/name/executionType）`,
        },
      }
    }
    nodes.push(node)
  }
  return {
    ok: true,
    data: {
      summary: typeof obj.summary === 'string' ? obj.summary : undefined,
      changeSummary: typeof obj.changeSummary === 'string' ? obj.changeSummary : undefined,
      riskNotes: typeof obj.riskNotes === 'string' ? obj.riskNotes : undefined,
      nodes,
      suggestedAgentTemplateIds: Array.isArray(obj.suggestedAgentTemplateIds)
        ? obj.suggestedAgentTemplateIds.filter((x): x is string => typeof x === 'string')
        : undefined,
      suggestedSkillIds: Array.isArray(obj.suggestedSkillIds)
        ? obj.suggestedSkillIds.filter((x): x is string => typeof x === 'string')
        : undefined,
      missingCapabilities: Array.isArray(obj.missingCapabilities)
        ? obj.missingCapabilities.filter((x): x is string => typeof x === 'string')
        : undefined,
      capabilityNotes: typeof obj.capabilityNotes === 'string' ? obj.capabilityNotes : undefined,
    },
  }
}
