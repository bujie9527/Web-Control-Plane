/**
 * LLM Executor 领域对象（Phase 15）
 * 统一模型配置、执行请求/响应与最小执行日志结构
 */

/** 执行层提供商（Phase 15/17），用于实际 API 路由 */
export type LLMProvider = 'openai_compatible' | 'openai'

/** 结构化输出模式 */
export type StructuredOutputMode = 'json_object' | 'json_schema' | 'none' | 'json' | 'markdown_json'

/** 模型配置（Phase 17.5 升级：支持 providerId、治理字段） */
export interface LLMModelConfig {
  id: string
  name: string
  nameZh: string
  /** 执行层兼容：无 providerId 时使用 */
  provider?: LLMProvider
  /** 配置中心 Provider 主键；有值时优先解析 Provider 再路由 */
  providerId?: string
  modelKey: string
  isEnabled: boolean
  isDefault: boolean
  temperature: number
  maxTokens: number
  timeoutMs: number
  retryCount: number
  structuredOutputMode: StructuredOutputMode
  fallbackModelKey?: string
  /** 备用模型配置 ID（Phase 17.5） */
  fallbackModelConfigId?: string
  supportedAgentCategories: string[]
  notes?: string
  createdAt?: string
  updatedAt?: string
}

/** LLM 执行请求 */
export interface LLMExecuteRequest {
  modelConfigId?: string
  modelKey?: string
  systemPrompt: string
  userPrompt: string
  temperature?: number
  maxTokens?: number
  timeoutMs?: number
  structuredSchema?: Record<string, unknown>
  outputMode?: StructuredOutputMode
  metadata?: Record<string, unknown>
}

/** LLM 执行结果 */
export interface LLMExecuteResult {
  success: boolean
  rawText: string
  parsedJson?: Record<string, unknown>
  errorCode?: string
  errorMessage?: string
  errorMessageZh?: string
  modelKey: string
  provider: LLMProvider
  latencyMs: number
}

/** LLM 执行日志 */
export interface LLMExecutionLog {
  id: string
  agentTemplateId: string
  skillCode: string
  sessionId?: string
  draftId?: string
  provider: LLMProvider
  modelKey: string
  success: boolean
  latencyMs: number
  errorCode?: string
  errorMessage?: string
  errorMessageZh?: string
  createdAt: string
}
