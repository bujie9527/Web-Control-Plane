/**
 * 模型配置中心中文标签（Phase 17.5）
 */
import type { LLMProviderType, LLMProviderStatus, LLMCredentialStatus, AgentLLMBindingType } from '@/modules/tenant/schemas/llmConfigCenter'

export const LLM_CREDENTIAL_STATUS_LABELS: Record<LLMCredentialStatus, string> = {
  active: '启用中',
  disabled: '已停用',
}

export const LLM_PROVIDER_TYPE_LABELS: Record<LLMProviderType, string> = {
  openai: 'OpenAI',
  azure_openai: 'Azure OpenAI',
  openai_compatible: 'OpenAI 兼容',
  custom: '自定义',
}

export const LLM_PROVIDER_STATUS_LABELS: Record<LLMProviderStatus, string> = {
  active: '启用中',
  disabled: '已停用',
}

export const AGENT_LLM_BINDING_TYPE_LABELS: Record<AgentLLMBindingType, string> = {
  primary: '主绑定',
  fallback: '备用绑定',
}

export const STRUCTURED_OUTPUT_MODE_LABELS: Record<string, string> = {
  json: 'JSON',
  json_schema: 'JSON Schema',
  markdown_json: 'Markdown + JSON',
  json_object: 'JSON 对象',
  none: '无',
}

export const AGENT_CATEGORY_LABELS: Record<string, string> = {
  planning: '规划',
  coordination: '协调',
  execution: '执行',
}

export const MODEL_CONFIG_STATUS_LABELS: Record<string, string> = {
  enabled: '启用中',
  disabled: '已停用',
}

export const PAGE_TITLE = '模型配置中心'
export const SECTION_CREDENTIALS = 'LLM 凭证'
export const SECTION_PROVIDERS = '模型提供商'
export const SECTION_MODEL_CONFIGS = '模型配置'
export const SECTION_AGENT_BINDINGS = 'Agent 模型绑定'

export const FIELD_CREDENTIAL_NAME = '凭证名称'
export const FIELD_SECRET_MASKED = '掩码密钥'

export const FIELD_PROVIDER_NAME = '提供商名称'
export const FIELD_PROVIDER_NAME_ZH = '中文名称'
export const FIELD_PROVIDER_TYPE = '提供商类型'
export const FIELD_BASE_URL = '接口地址'
export const FIELD_STATUS = '状态'
export const FIELD_MODEL_NAME = '模型名称'
export const FIELD_MODEL_KEY = '模型标识'
export const FIELD_DEFAULT_MODEL = '默认模型'
export const FIELD_TEMPERATURE = '温度'
export const FIELD_MAX_TOKENS = '最大输出长度'
export const FIELD_TIMEOUT_MS = '超时时间'
export const FIELD_RETRY_COUNT = '重试次数'
export const FIELD_STRUCTURED_OUTPUT = '结构化输出模式'
export const FIELD_AGENT_CATEGORIES = '适用 Agent 分类'
export const FIELD_AGENT_NAME = 'Agent 中文名称'
export const FIELD_PRIMARY_MODEL = '主模型'
export const FIELD_FALLBACK_MODEL = '备用模型'
export const FIELD_BINDING_STATUS = '绑定状态'
export const FIELD_NOTES = '备注'
