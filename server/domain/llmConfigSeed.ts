/**
 * LLM 配置中心种子数据（2 Provider + 2 ModelConfig + 4 Binding），表为空时写入
 */
import { prisma } from './prismaClient'

const now = (): string => new Date().toISOString().slice(0, 19).replace('T', ' ')

export async function seedLLMConfigIfEmpty(): Promise<void> {
  const providerCount = await prisma.lLMProvider.count()
  if (providerCount > 0) return

  const ts = now()
  await prisma.lLMProvider.createMany({
    data: [
      {
        id: 'provider-openai',
        name: 'OpenAI',
        nameZh: 'OpenAI',
        providerType: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        credentialId: 'cred-openai-1',
        status: 'active',
        notes: null,
        createdAt: ts,
        updatedAt: ts,
      },
      {
        id: 'provider-openai-compatible',
        name: 'OpenAI Compatible',
        nameZh: 'OpenAI 兼容',
        providerType: 'openai_compatible',
        baseUrl: null,
        credentialId: null,
        status: 'disabled',
        notes: null,
        createdAt: ts,
        updatedAt: ts,
      },
    ],
  })

  await prisma.lLMModelConfig.createMany({
    data: [
      {
        id: 'llm-openai-main',
        name: 'OpenAI GPT-4o',
        nameZh: 'OpenAI 主规划模型',
        providerId: 'provider-openai',
        modelKey: 'gpt-4o',
        isEnabled: true,
        isDefault: true,
        temperature: 0.4,
        maxTokens: 4096,
        timeoutMs: 20000,
        retryCount: 1,
        structuredOutputMode: 'json_schema',
        fallbackModelConfigId: null,
        supportedAgentCategories: '["planning"]',
        notes: null,
        createdAt: ts,
        updatedAt: ts,
      },
      {
        id: 'llm-openai-worker',
        name: 'OpenAI GPT-4o Mini (Worker)',
        nameZh: 'Worker 执行模型',
        providerId: 'provider-openai',
        modelKey: 'gpt-4o-mini',
        isEnabled: true,
        isDefault: false,
        temperature: 0.6,
        maxTokens: 2048,
        timeoutMs: 30000,
        retryCount: 1,
        structuredOutputMode: 'json_object',
        fallbackModelConfigId: null,
        supportedAgentCategories: '["planning","execution"]',
        notes: null,
        createdAt: ts,
        updatedAt: ts,
      },
    ],
  })

  await prisma.agentLLMBinding.createMany({
    data: [
      {
        id: 'binding-planner-main',
        agentTemplateId: 'at-workflow-planner',
        modelConfigId: 'llm-openai-main',
        bindingType: 'primary',
        priority: 0,
        isEnabled: true,
        notes: null,
        createdAt: ts,
        updatedAt: ts,
      },
      {
        id: 'binding-creator-base',
        agentTemplateId: 'at-base-content-creator',
        modelConfigId: 'llm-openai-worker',
        bindingType: 'primary',
        priority: 0,
        isEnabled: true,
        notes: null,
        createdAt: ts,
        updatedAt: ts,
      },
      {
        id: 'binding-creator-facebook',
        agentTemplateId: 'at-facebook-content-creator',
        modelConfigId: 'llm-openai-worker',
        bindingType: 'primary',
        priority: 0,
        isEnabled: true,
        notes: null,
        createdAt: ts,
        updatedAt: ts,
      },
      {
        id: 'binding-reviewer',
        agentTemplateId: 'at-content-reviewer',
        modelConfigId: 'llm-openai-worker',
        bindingType: 'primary',
        priority: 0,
        isEnabled: true,
        notes: null,
        createdAt: ts,
        updatedAt: ts,
      },
    ],
  })
}
