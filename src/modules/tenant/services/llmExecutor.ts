/**
 * LLM Executor（Phase 17.7a）
 * 主链路：调用后端 /api/llm/execute，不再依赖前端 VITE_OPENAI_API_KEY
 */
import type { LLMExecuteRequest, LLMExecuteResult, LLMProvider } from '../schemas/llmExecutor'

const API_BASE = typeof window !== 'undefined' ? '' : 'http://localhost:3001'

async function callExecuteApi(request: {
  modelConfigId?: string
  agentTemplateId?: string
  systemPrompt?: string
  userPrompt: string
  temperature?: number
  maxTokens?: number
  timeoutMs?: number
  outputMode?: string
  structuredSchema?: Record<string, unknown>
  metadata?: Record<string, unknown>
}): Promise<LLMExecuteResult> {
  const started = Date.now()
  try {
    const res = await fetch(`${API_BASE}/api/llm/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modelConfigId: request.modelConfigId,
        agentTemplateId: request.agentTemplateId,
        systemPrompt: request.systemPrompt ?? '请按要求输出。',
        userPrompt: request.userPrompt,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
        timeoutMs: request.timeoutMs,
        outputMode: request.outputMode ?? 'json_schema',
        structuredSchema: request.structuredSchema,
        metadata: request.metadata,
      }),
    })

    const data = (await res.json()) as {
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

    if (!res.ok) {
      return {
        success: false,
        rawText: '',
        modelKey: data.modelKey ?? 'unknown',
        provider: (data.provider as LLMProvider) ?? 'openai_compatible',
        latencyMs: data.latencyMs ?? Date.now() - started,
        errorCode: data.errorCode ?? 'API_ERROR',
        errorMessage: data.errorMessage,
        errorMessageZh: data.errorMessageZh ?? '后端 LLM 服务调用失败',
      }
    }

    return {
      success: data.success,
      rawText: data.rawText ?? '',
      parsedJson: data.parsedJson,
      modelKey: data.modelKey ?? 'unknown',
      provider: (data.provider as LLMProvider) ?? 'openai',
      latencyMs: data.latencyMs ?? Date.now() - started,
      errorCode: data.errorCode,
      errorMessage: data.errorMessage,
      errorMessageZh: data.errorMessageZh,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    const isNetwork = /fetch|network|failed/i.test(msg)
    return {
      success: false,
      rawText: '',
      modelKey: request.modelConfigId ?? 'unknown',
      provider: 'openai_compatible',
      latencyMs: Date.now() - started,
      errorCode: 'NETWORK_OR_RUNTIME_ERROR',
      errorMessage: msg,
      errorMessageZh: isNetwork
        ? '无法连接 LLM 服务，请确认已启动 API 服务（npm run dev:api）并配置 OPENAI_API_KEY'
        : `调用异常：${msg.slice(0, 60)}`,
    }
  }
}

export async function executeLLM(request: LLMExecuteRequest): Promise<LLMExecuteResult> {
  return callExecuteApi({
    modelConfigId: request.modelConfigId,
    systemPrompt: request.systemPrompt,
    userPrompt: request.userPrompt,
    temperature: request.temperature,
    maxTokens: request.maxTokens,
    timeoutMs: request.timeoutMs,
    outputMode: request.outputMode,
    structuredSchema: request.structuredSchema,
    metadata: request.metadata,
  })
}
