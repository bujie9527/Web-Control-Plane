/**
 * 服务端 LLM 数据（Phase 17.7a）
 * 与前端 mock 结构一致，密钥从 process.env.OPENAI_API_KEY 读取
 */
export interface ServerProvider {
  id: string
  name: string
  nameZh: string
  providerType: string
  baseUrl?: string
  credentialId?: string
  status: string
}

export interface ServerModelConfig {
  id: string
  name: string
  nameZh: string
  providerId?: string
  modelKey: string
  isEnabled: boolean
  temperature: number
  maxTokens: number
  timeoutMs: number
  retryCount: number
  structuredOutputMode: string
}

export interface ServerBinding {
  id: string
  agentTemplateId: string
  modelConfigId: string
  bindingType: string
  isEnabled: boolean
}

const providers: ServerProvider[] = [
  {
    id: 'provider-openai',
    name: 'OpenAI',
    nameZh: 'OpenAI',
    providerType: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    credentialId: 'cred-openai-1',
    status: 'active',
  },
  {
    id: 'provider-openai-compatible',
    name: 'OpenAI Compatible',
    nameZh: 'OpenAI 兼容',
    providerType: 'openai_compatible',
    baseUrl: '',
    credentialId: undefined,
    status: 'disabled',
  },
]

const modelConfigs: ServerModelConfig[] = [
  {
    id: 'llm-openai-main',
    name: 'OpenAI GPT-4o',
    nameZh: 'OpenAI 主规划模型',
    providerId: 'provider-openai',
    modelKey: 'gpt-4o',
    isEnabled: true,
    temperature: 0.4,
    maxTokens: 4096,
    timeoutMs: 20000,
    retryCount: 1,
    structuredOutputMode: 'json_schema',
  },
  {
    id: 'llm-openai-worker',
    name: 'OpenAI GPT-4o Mini (Worker)',
    nameZh: 'Worker 执行模型',
    providerId: 'provider-openai',
    modelKey: 'gpt-4o-mini',
    isEnabled: true,
    temperature: 0.6,
    maxTokens: 2048,
    timeoutMs: 30000,
    retryCount: 1,
    structuredOutputMode: 'json_object',
  },
]

const bindings: ServerBinding[] = [
  { id: 'b1', agentTemplateId: 'at-workflow-planner', modelConfigId: 'llm-openai-main', bindingType: 'primary', isEnabled: true },
  { id: 'b2', agentTemplateId: 'at-base-content-creator', modelConfigId: 'llm-openai-worker', bindingType: 'primary', isEnabled: true },
  { id: 'b3', agentTemplateId: 'at-facebook-content-creator', modelConfigId: 'llm-openai-worker', bindingType: 'primary', isEnabled: true },
  { id: 'b4', agentTemplateId: 'at-content-reviewer', modelConfigId: 'llm-openai-worker', bindingType: 'primary', isEnabled: true },
]

export function getProviderById(id: string): ServerProvider | undefined {
  return providers.find((p) => p.id === id)
}

export function getModelConfigById(id: string): ServerModelConfig | undefined {
  return modelConfigs.find((c) => c.id === id)
}

export function getPrimaryBindingByAgent(agentTemplateId: string): ServerBinding | undefined {
  return bindings.find((b) => b.agentTemplateId === agentTemplateId && b.bindingType === 'primary' && b.isEnabled)
}

export function getFirstModelKeyByProvider(providerId: string): string | undefined {
  const cfg = modelConfigs.find((c) => c.providerId === providerId && c.isEnabled)
  return cfg?.modelKey
}

/**
 * 从 Credential 读取密钥（仅服务端）
 */
export { getServerCredentialSecret as getCredentialSecret } from '../data/credentialStore'
