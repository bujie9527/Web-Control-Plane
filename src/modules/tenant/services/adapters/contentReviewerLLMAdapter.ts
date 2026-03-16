/**
 * Content Reviewer LLM Adapter（Phase 17/17.5）
 * 构建 prompt，调用 llmExecutor，返回解析后的结构化审核结果；
 * Phase 17.5：通过 binding 获取模型配置，不再写死 modelConfigId
 */
import { executeLLM } from '../llmExecutor'
import { getAgentPrimaryModelConfigAsync } from '../llmBindingService'
import { parseContentReviewerOutput } from '../parsers/contentReviewerOutputParser'

const DEFAULT_REVIEWER_AGENT_ID = 'at-content-reviewer'

export interface ContentReviewerAdapterInput {
  agentTemplateId?: string
  content: string
  guidelines?: string
}

export interface ContentReviewerAdapterSuccess {
  ok: true
  data: {
    reviewResult: 'approved' | 'revise'
    issues: string[]
    suggestions: string[]
    summary: string
  }
  rawText: string
  latencyMs: number
  modelKey: string
}

export interface ContentReviewerAdapterFail {
  ok: false
  errorCode: string
  errorMessage: string
  errorMessageZh: string
}

export type ContentReviewerAdapterResult = ContentReviewerAdapterSuccess | ContentReviewerAdapterFail

function buildPrompts(
  input: ContentReviewerAdapterInput
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `你是一名内容审核助手。
请仅输出 JSON，不要输出其他说明。
输出结构必须包含：
- reviewResult: "approved" 或 "revise"（必填）
- issues: 问题列表（数组）
- suggestions: 修改建议（数组）
- summary: 审核摘要`

  const userPrompt = `请审核以下内容：

${input.content}

${input.guidelines ? `审核要求：${input.guidelines}` : ''}

请输出 JSON：reviewResult（approved/revise）、issues、suggestions、summary。`

  return { systemPrompt, userPrompt }
}

export async function runContentReviewerLLM(
  input: ContentReviewerAdapterInput
): Promise<ContentReviewerAdapterResult> {
  const agentId = input.agentTemplateId ?? DEFAULT_REVIEWER_AGENT_ID
  const config = await getAgentPrimaryModelConfigAsync(agentId)
  if (!config || !config.isEnabled) {
    return {
      ok: false,
      errorCode: 'MODEL_CONFIG_NOT_FOUND',
      errorMessage: 'No primary model config bound for Content Reviewer',
      errorMessageZh: '未配置内容审核助手模型，请在模型配置中心绑定',
    }
  }

  const { systemPrompt, userPrompt } = buildPrompts(input)
  const result = await executeLLM({
    modelConfigId: config.id,
    systemPrompt,
    userPrompt,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    outputMode: 'json_object',
  })

  if (!result.success) {
    return {
      ok: false,
      errorCode: result.errorCode ?? 'LLM_EXECUTION_FAILED',
      errorMessage: result.errorMessage ?? 'LLM call failed',
      errorMessageZh: result.errorMessageZh ?? 'Worker LLM 调用失败',
    }
  }

  const parseResult = parseContentReviewerOutput(result.rawText)
  if (!parseResult.ok) {
    return {
      ok: false,
      errorCode: parseResult.error.code,
      errorMessage: parseResult.error.message,
      errorMessageZh: parseResult.error.messageZh,
    }
  }

  return {
    ok: true,
    data: parseResult.data,
    rawText: result.rawText,
    latencyMs: result.latencyMs,
    modelKey: result.modelKey,
  }
}
