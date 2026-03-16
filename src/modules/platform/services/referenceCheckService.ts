/**
 * 引用检查服务（Phase 18 — 改为 async 调真实 API）
 *
 * 迁移说明：
 *   Before: 同步读 mock
 *   After:  异步调各资源 API
 *
 * 所有检查函数统一改为 async，调用方需 await。
 */
import * as workflowInstanceRepo from '@/modules/tenant/repositories/workflowInstanceRepository'
import * as agentLLMBindingRepo from '@/modules/tenant/repositories/agentLLMBindingRepository'
import * as llmProviderRepo from '@/modules/tenant/repositories/llmProviderRepository'

export interface ReferenceCheckResult {
  inUse: boolean
  referenceCount: number
  referenceTypes: string[]
}

/**
 * 检查流程模板被引用情况（是否有 WorkflowInstance 使用该模板）
 */
export async function checkWorkflowTemplateReferences(
  templateId: string
): Promise<ReferenceCheckResult> {
  try {
    const res = await workflowInstanceRepo.fetchInstanceListByTemplateId(templateId)
    const refs = res.data ?? []
    return {
      inUse: refs.length > 0,
      referenceCount: refs.length,
      referenceTypes: refs.length > 0 ? ['流程实例'] : [],
    }
  } catch {
    return { inUse: false, referenceCount: 0, referenceTypes: [] }
  }
}

/**
 * 检查 Agent 模板被引用情况（是否有 AgentLLMBinding 使用该模板）
 */
export async function checkAgentTemplateReferences(
  agentTemplateId: string
): Promise<ReferenceCheckResult> {
  try {
    const bindings = await agentLLMBindingRepo.fetchBindingList(agentTemplateId)
    return {
      inUse: bindings.length > 0,
      referenceCount: bindings.length,
      referenceTypes: bindings.length > 0 ? ['Agent 模型绑定'] : [],
    }
  } catch {
    return { inUse: false, referenceCount: 0, referenceTypes: [] }
  }
}

/**
 * 检查模型配置被引用情况（是否有 AgentLLMBinding 使用该配置）
 */
export async function checkModelConfigReferences(
  modelConfigId: string
): Promise<ReferenceCheckResult> {
  try {
    const allBindings = await agentLLMBindingRepo.fetchBindingList()
    const refs = allBindings.filter((b) => b.modelConfigId === modelConfigId)
    return {
      inUse: refs.length > 0,
      referenceCount: refs.length,
      referenceTypes: refs.length > 0 ? ['Agent 模型绑定'] : [],
    }
  } catch {
    return { inUse: false, referenceCount: 0, referenceTypes: [] }
  }
}

/**
 * 检查凭证被引用情况（从 API 拉取 Provider 列表）
 */
export async function checkCredentialReferencesAsync(
  credentialId: string
): Promise<ReferenceCheckResult> {
  try {
    const providers = await llmProviderRepo.fetchProviderList()
    const refs = providers.filter((p) => p.credentialId === credentialId)
    return {
      inUse: refs.length > 0,
      referenceCount: refs.length,
      referenceTypes: refs.length > 0 ? ['模型提供商'] : [],
    }
  } catch {
    return { inUse: false, referenceCount: 0, referenceTypes: [] }
  }
}

/** 检查 Skill 被引用情况（占位：后续可接真实 API） */
export async function checkSkillReferences(_skillId: string): Promise<ReferenceCheckResult> {
  return { inUse: false, referenceCount: 0, referenceTypes: [] }
}

/**
 * 向后兼容：同步版本（已废弃，调用方应改用 checkCredentialReferencesAsync）
 * @deprecated 请改用 checkCredentialReferencesAsync
 */
export function checkCredentialReferences(credentialId: string): ReferenceCheckResult {
  void credentialId
  return { inUse: false, referenceCount: 0, referenceTypes: [] }
}
