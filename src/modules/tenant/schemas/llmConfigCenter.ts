/**
 * LLM 配置中心领域对象（Phase 17.5）
 * Provider、ModelConfig 治理与 Agent 模型绑定
 */

/** 提供商类型 */
export type LLMProviderType = 'openai' | 'azure_openai' | 'openai_compatible' | 'custom'

/** 提供商状态 */
export type LLMProviderStatus = 'active' | 'disabled'

/** 模型配置结构化输出模式 */
export type LLMModelStructuredOutputMode = 'json' | 'json_schema' | 'markdown_json'

/** 适用 Agent 分类 */
export type AgentCategory = 'planning' | 'coordination' | 'execution'

/** 绑定类型 */
export type AgentLLMBindingType = 'primary' | 'fallback'

/** 凭证状态 */
export type LLMCredentialStatus = 'active' | 'disabled'

/**
 * LLM 凭证（Phase 17.7）
 * 密钥存储在服务端，前台永远只展示 secretMasked
 */
export interface LLMCredential {
  id: string
  name: string
  nameZh: string
  providerType: LLMProviderType
  /** 加密后的密钥（服务端存储，前台不返回） */
  encryptedSecret: string
  /** 掩码展示，如 sk-****...****xyz */
  secretMasked: string
  status: LLMCredentialStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

/** 模型提供商（Phase 17.7：apiKeyRef 改为 credentialId） */
export interface LLMProvider {
  id: string
  name: string
  nameZh: string
  providerType: LLMProviderType
  baseUrl?: string
  /** 关联凭证 ID，通过 credentialId 获取密钥（仅服务端） */
  credentialId?: string
  status: LLMProviderStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

/** Agent 与模型绑定 */
export interface AgentLLMBinding {
  id: string
  agentTemplateId: string
  modelConfigId: string
  bindingType: AgentLLMBindingType
  priority: number
  isEnabled: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}
