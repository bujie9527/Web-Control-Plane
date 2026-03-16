import type { AgentLLMBinding } from '../schemas/llmConfigCenter'

const _bindings: AgentLLMBinding[] = [
  {
    id: 'binding-planner-main',
    agentTemplateId: 'at-workflow-planner',
    modelConfigId: 'llm-openai-main',
    bindingType: 'primary',
    priority: 0,
    isEnabled: true,
    notes: '基础流程规划助手主模型',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'binding-creator-base',
    agentTemplateId: 'at-base-content-creator',
    modelConfigId: 'llm-openai-worker',
    bindingType: 'primary',
    priority: 0,
    isEnabled: true,
    notes: '内容生成助手',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'binding-creator-facebook',
    agentTemplateId: 'at-facebook-content-creator',
    modelConfigId: 'llm-openai-worker',
    bindingType: 'primary',
    priority: 0,
    isEnabled: true,
    notes: 'Facebook 内容生成',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'binding-reviewer',
    agentTemplateId: 'at-content-reviewer',
    modelConfigId: 'llm-openai-worker',
    bindingType: 'primary',
    priority: 0,
    isEnabled: true,
    notes: '内容审核助手',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
]

export function listAgentLLMBindings(): AgentLLMBinding[] {
  return [..._bindings]
}

export function getAgentLLMBindingsByAgent(agentTemplateId: string): AgentLLMBinding[] {
  return _bindings.filter((b) => b.agentTemplateId === agentTemplateId)
}

export function getAgentPrimaryBinding(agentTemplateId: string): AgentLLMBinding | null {
  return (
    _bindings.find(
      (b) => b.agentTemplateId === agentTemplateId && b.bindingType === 'primary' && b.isEnabled
    ) ?? null
  )
}

export function getAgentFallbackBinding(agentTemplateId: string): AgentLLMBinding | null {
  return (
    _bindings.find(
      (b) => b.agentTemplateId === agentTemplateId && b.bindingType === 'fallback' && b.isEnabled
    ) ?? null
  )
}

export function createAgentLLMBinding(
  payload: Omit<AgentLLMBinding, 'id' | 'createdAt' | 'updatedAt'>
): AgentLLMBinding {
  const now = new Date().toISOString()
  const id = `binding-${payload.agentTemplateId}-${payload.bindingType}-${Date.now()}`
  const entity: AgentLLMBinding = {
    ...payload,
    id,
    createdAt: now,
    updatedAt: now,
  }
  _bindings.push(entity)
  return entity
}

export function updateAgentLLMBinding(
  id: string,
  payload: Partial<Omit<AgentLLMBinding, 'id' | 'createdAt'>>
): AgentLLMBinding | null {
  const idx = _bindings.findIndex((b) => b.id === id)
  if (idx < 0) return null
  _bindings[idx] = { ..._bindings[idx], ...payload, updatedAt: new Date().toISOString() }
  return _bindings[idx]
}

export function deleteAgentLLMBinding(id: string): boolean {
  const idx = _bindings.findIndex((b) => b.id === id)
  if (idx < 0) return false
  _bindings.splice(idx, 1)
  return true
}

function disableOtherEnabledBindings(agentTemplateId: string, bindingType: AgentLLMBinding['bindingType'], keepId: string) {
  _bindings.forEach((b, idx) => {
    if (b.agentTemplateId !== agentTemplateId) return
    if (b.bindingType !== bindingType) return
    if (!b.isEnabled) return
    if (b.id === keepId) return
    _bindings[idx] = { ...b, isEnabled: false, updatedAt: new Date().toISOString() }
  })
}

/**
 * 设置主绑定（Phase 17.6）
 * - 同一 Agent 只允许一个启用中的 primary
 * - 若已存在 primary，则替换其 modelConfigId 并保持 enabled
 * - 若不存在 primary，则创建一个 enabled primary
 */
export function setPrimaryBinding(agentTemplateId: string, modelConfigId: string): AgentLLMBinding {
  const now = new Date().toISOString()
  const existing = _bindings.find((b) => b.agentTemplateId === agentTemplateId && b.bindingType === 'primary')
  if (existing) {
    const updated = { ...existing, modelConfigId, isEnabled: true, updatedAt: now }
    const idx = _bindings.findIndex((b) => b.id === existing.id)
    if (idx >= 0) _bindings[idx] = updated
    disableOtherEnabledBindings(agentTemplateId, 'primary', updated.id)
    return updated
  }
  const created: AgentLLMBinding = {
    id: `binding-${agentTemplateId}-primary-${Date.now()}`,
    agentTemplateId,
    modelConfigId,
    bindingType: 'primary',
    priority: 0,
    isEnabled: true,
    notes: '',
    createdAt: now,
    updatedAt: now,
  }
  _bindings.push(created)
  disableOtherEnabledBindings(agentTemplateId, 'primary', created.id)
  return created
}

/**
 * 设置备用绑定（Phase 17.6）
 * - 同一 Agent 首版只保留一个 fallback（若存在则替换）
 */
export function setFallbackBinding(agentTemplateId: string, modelConfigId: string): AgentLLMBinding {
  const now = new Date().toISOString()
  const existing = _bindings.find((b) => b.agentTemplateId === agentTemplateId && b.bindingType === 'fallback')
  if (existing) {
    const updated = { ...existing, modelConfigId, isEnabled: true, updatedAt: now }
    const idx = _bindings.findIndex((b) => b.id === existing.id)
    if (idx >= 0) _bindings[idx] = updated
    disableOtherEnabledBindings(agentTemplateId, 'fallback', updated.id)
    return updated
  }
  const created: AgentLLMBinding = {
    id: `binding-${agentTemplateId}-fallback-${Date.now()}`,
    agentTemplateId,
    modelConfigId,
    bindingType: 'fallback',
    priority: 0,
    isEnabled: true,
    notes: '',
    createdAt: now,
    updatedAt: now,
  }
  _bindings.push(created)
  disableOtherEnabledBindings(agentTemplateId, 'fallback', created.id)
  return created
}
