/**
 * 服务端 LLM Executor（Phase 17.7a）
 * 执行流程：AgentTemplate → AgentLLMBinding → LLMModelConfig → LLMProvider → LLMCredential → Provider Adapter
 */
import { resolveModelConfigByAgent, resolveByModelConfigId } from './llmResolverService'
import { callOpenAIServer } from './providers/openaiProviderServer'

export interface ExecuteLLMServerRequest {
  agentTemplateId?: string
  modelConfigId?: string
  systemPrompt?: string
  userPrompt: string
  temperature?: number
  maxTokens?: number
  timeoutMs?: number
  outputMode?: 'json' | 'json_schema' | 'markdown_json' | 'json_object' | 'none'
  structuredSchema?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export interface ExecuteLLMServerResult {
  success: boolean
  rawText: string
  parsedJson?: Record<string, unknown>
  modelKey: string
  provider: string
  latencyMs: number
  errorCode?: string
  errorMessage?: string
  errorMessageZh?: string
}

function parseJsonFromText(text: string): Record<string, unknown> | undefined {
  try {
    const jsonStr = text
      .replace(/```json\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim()
    const first = jsonStr.indexOf('{')
    const last = jsonStr.lastIndexOf('}')
    return first >= 0 && last > first ? (JSON.parse(jsonStr.slice(first, last + 1)) as Record<string, unknown>) : undefined
  } catch {
    return undefined
  }
}

export async function executeLLMServer(request: ExecuteLLMServerRequest): Promise<ExecuteLLMServerResult> {
  const started = Date.now()

  let resolved: { config: { modelKey: string; temperature: number; maxTokens: number; baseUrl: string; apiKey: string } } | { error: { code: string; messageZh: string } }

  if (request.modelConfigId) {
    resolved = await resolveByModelConfigId(request.modelConfigId)
  } else if (request.agentTemplateId) {
    resolved = await resolveModelConfigByAgent(request.agentTemplateId)
  } else {
    return {
      success: false,
      rawText: '',
      modelKey: 'unknown',
      provider: 'openai',
      latencyMs: Date.now() - started,
      errorCode: 'MISSING_CONFIG',
      errorMessage: 'Missing modelConfigId or agentTemplateId',
      errorMessageZh: '缺少 modelConfigId 或 agentTemplateId',
    }
  }

  if ('error' in resolved) {
    return {
      success: false,
      rawText: '',
      modelKey: 'unknown',
      provider: 'openai',
      latencyMs: Date.now() - started,
      errorCode: resolved.error.code,
      errorMessageZh: resolved.error.messageZh,
    }
  }

  const { config } = resolved
  const outputMode = request.outputMode ?? 'json_schema'
  const temperature = request.temperature ?? config.temperature
  const maxTokens = request.maxTokens ?? config.maxTokens

  const result = await callOpenAIServer({
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    model: config.modelKey,
    systemPrompt: request.systemPrompt ?? '请按要求输出。',
    userPrompt: request.userPrompt,
    temperature,
    maxTokens,
    outputMode: request.outputMode,
    structuredSchema: request.structuredSchema,
  })

  const latencyMs = Date.now() - started

  if (!result.success) {
    const errMsgZh =
      result.errorCode === 'API_KEY_MISSING'
        ? '凭证密钥未配置，请在模型配置中心 → LLM 凭证中填写密钥'
        : result.errorCode?.startsWith('OPENAI_401')
          ? '密钥无效或未授权'
          : result.errorCode?.startsWith('OPENAI_429')
            ? '请求频率超限'
            : result.errorCode?.startsWith('OPENAI_5')
              ? '模型服务暂时不可用'
              : result.errorMessage ?? '调用失败'
    return {
      success: false,
      rawText: '',
      modelKey: config.modelKey,
      provider: 'openai',
      latencyMs,
      errorCode: result.errorCode,
      errorMessage: result.errorMessage,
      errorMessageZh: errMsgZh,
    }
  }

  let parsedJson: Record<string, unknown> | undefined
  if (outputMode !== 'none' && result.text) {
    parsedJson = parseJsonFromText(result.text)
  }

  return {
    success: true,
    rawText: result.text,
    parsedJson,
    modelKey: config.modelKey,
    provider: 'openai',
    latencyMs,
  }
}
