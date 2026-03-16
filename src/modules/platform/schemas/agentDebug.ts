/**
 * Agent 调试模式类型定义
 * 管理员在后台与 Agent 互动测试、配置文档编辑
 */

/** 消息角色 */
export type AgentDebugRole = 'user' | 'assistant' | 'system'

/** 单条对话消息 */
export interface AgentDebugMessage {
  id: string
  role: AgentDebugRole
  content: string
  timestamp: string
  latencyMs?: number
  modelKey?: string
  errorMessageZh?: string
}

/** 调试时可覆盖的配置（不写回 mock 时仅当次有效） */
export interface AgentDebugConfigOverrides {
  systemPromptTemplate?: string
  instructionTemplate?: string
  outputFormat?: string
  temperature?: number
  maxTokens?: number
}

/** 调试执行结果 */
export interface AgentDebugExecuteResult {
  ok: boolean
  rawText?: string
  parsedJson?: Record<string, unknown>
  latencyMs?: number
  modelKey?: string
  errorCode?: string
  errorMessageZh?: string
}
