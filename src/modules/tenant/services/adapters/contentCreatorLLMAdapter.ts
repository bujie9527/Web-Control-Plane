/**
 * Content Creator LLM Adapter（Phase 17/17.5）
 * 构建 prompt，调用 llmExecutor，返回解析后的结构化输出；
 * Phase 17.5：通过 binding 获取模型配置，不再写死 modelConfigId
 */
import { executeLLM } from '../llmExecutor'
import { getAgentPrimaryModelConfigAsync } from '../llmBindingService'
import { parseContentCreatorOutput } from '../parsers/contentCreatorOutputParser'

/** 无绑定时使用的默认 Agent 模板（兼容旧调用） */
const DEFAULT_CREATOR_AGENT_ID = 'at-base-content-creator'

export interface ContentCreatorAdapterInput {
  agentTemplateId?: string
  goal?: string
  topic?: string
  context?: string
}

export interface ContentCreatorAdapterSuccess {
  ok: true
  data: {
    content: string
    summary: string
    tags: string[]
    notes: string
  }
  rawText: string
  latencyMs: number
  modelKey: string
}

export interface ContentCreatorAdapterFail {
  ok: false
  errorCode: string
  errorMessage: string
  errorMessageZh: string
}

export type ContentCreatorAdapterResult = ContentCreatorAdapterSuccess | ContentCreatorAdapterFail

function buildPrompts(input: ContentCreatorAdapterInput): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `你是一名内容创作助手，负责生成社媒内容。
请仅输出 JSON，不要输出其他说明。
输出结构必须包含：
- content: 正文内容（必填）
- summary: 内容摘要
- tags: 标签数组
- notes: 备注`

  const userPrompt = `任务目标：${input.goal ?? '生成社媒内容'}
主题：${input.topic ?? '通用'}
${input.context ? `要求：${input.context}` : ''}

请输出结构化 JSON，包含 content、summary、tags、notes。`

  return { systemPrompt, userPrompt }
}

export async function runContentCreatorLLM(
  input: ContentCreatorAdapterInput
): Promise<ContentCreatorAdapterResult> {
  const agentId = input.agentTemplateId ?? DEFAULT_CREATOR_AGENT_ID
  const config = await getAgentPrimaryModelConfigAsync(agentId)
  if (!config || !config.isEnabled) {
    return {
      ok: false,
      errorCode: 'MODEL_CONFIG_NOT_FOUND',
      errorMessage: 'No primary model config bound for Content Creator',
      errorMessageZh: '未配置内容生成助手模型，请在模型配置中心绑定',
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

  const parseResult = parseContentCreatorOutput(result.rawText)
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
