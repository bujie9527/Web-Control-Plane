/**
 * 服务端 LLM Executor（Phase 17.7）
 * 执行流程：AgentTemplate → AgentLLMBinding → LLMModelConfig → LLMProvider → LLMCredential → Provider Adapter
 *
 * 说明：当前项目为纯前端 Vite 应用，本模块为服务端骨架。
 * 接入真实后端时，由 API 路由调用本模块，前端通过 HTTP 请求获取 LLM 结果。
 */
export interface ExecuteLLMServerRequest {
  agentTemplateId: string
  systemPrompt: string
  userPrompt: string
  structuredSchema?: Record<string, unknown>
  outputMode?: 'json' | 'json_schema' | 'markdown_json' | 'json_object' | 'none'
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

/**
 * 服务端 LLM 执行入口
 * 调用链：AgentTemplate → AgentLLMBinding → LLMModelConfig → LLMProvider → LLMCredential → Provider Adapter
 */
export async function executeLLMServer(
  _request: ExecuteLLMServerRequest
): Promise<ExecuteLLMServerResult> {
  // 当前为骨架：需接入 agentBinding、modelConfig、provider、credential 的 repository/service
  // 服务端从 credential 读取密钥（前端不得持有），调用 provider adapter
  const started = Date.now()
  return {
    success: false,
    rawText: '',
    modelKey: 'unknown',
    provider: 'server-skeleton',
    latencyMs: Date.now() - started,
    errorCode: 'SERVER_EXECUTOR_NOT_IMPLEMENTED',
    errorMessage: 'Server LLM executor is a placeholder; integrate with backend API',
    errorMessageZh: '服务端 LLM 执行器为占位实现，需接入后端 API',
  }
}
