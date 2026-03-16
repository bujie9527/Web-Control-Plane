/**
 * LLM 配置中心服务端持久化（批次 7）：Provider / ModelConfig / AgentLLMBinding
 */
import { prisma } from './prismaClient'

const now = (): string => new Date().toISOString().slice(0, 19).replace('T', ' ')

function parseJsonArray(s: string | null): string[] {
  if (!s) return []
  try {
    const a = JSON.parse(s)
    return Array.isArray(a) ? a : []
  } catch {
    return []
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProvider(row: any) {
  return {
    id: row.id,
    name: row.name,
    nameZh: row.nameZh ?? undefined,
    providerType: row.providerType,
    baseUrl: row.baseUrl ?? undefined,
    credentialId: row.credentialId ?? undefined,
    status: row.status,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToModelConfig(row: any) {
  return {
    id: row.id,
    name: row.name,
    nameZh: row.nameZh ?? undefined,
    providerId: row.providerId,
    modelKey: row.modelKey,
    isEnabled: row.isEnabled,
    isDefault: row.isDefault,
    temperature: row.temperature,
    maxTokens: row.maxTokens,
    timeoutMs: row.timeoutMs,
    retryCount: row.retryCount,
    structuredOutputMode: row.structuredOutputMode,
    fallbackModelConfigId: row.fallbackModelConfigId ?? undefined,
    supportedAgentCategories: parseJsonArray(row.supportedAgentCategories).length
      ? parseJsonArray(row.supportedAgentCategories)
      : [],
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToBinding(row: any) {
  return {
    id: row.id,
    agentTemplateId: row.agentTemplateId,
    modelConfigId: row.modelConfigId,
    bindingType: row.bindingType,
    priority: row.priority,
    isEnabled: row.isEnabled,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

// ─── Provider ───────────────────────────────────────────────────────────────

export async function dbListProviders(): Promise<ReturnType<typeof rowToProvider>[]> {
  const rows = await prisma.lLMProvider.findMany({ orderBy: { updatedAt: 'desc' } })
  return rows.map(rowToProvider)
}

export async function dbGetProviderById(id: string): Promise<ReturnType<typeof rowToProvider> | null> {
  const row = await prisma.lLMProvider.findUnique({ where: { id } })
  return row ? rowToProvider(row) : null
}

export async function dbCreateProvider(payload: {
  name: string
  nameZh?: string
  providerType: string
  baseUrl?: string
  credentialId?: string
  status?: string
  notes?: string
}): Promise<ReturnType<typeof rowToProvider>> {
  const ts = now()
  const id = (payload as { id?: string }).id?.trim() || `provider-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const row = await prisma.lLMProvider.create({
    data: {
      id,
      name: payload.name,
      nameZh: payload.nameZh ?? null,
      providerType: payload.providerType,
      baseUrl: payload.baseUrl ?? null,
      credentialId: payload.credentialId ?? null,
      status: payload.status ?? 'active',
      notes: payload.notes ?? null,
      createdAt: ts,
      updatedAt: ts,
    },
  })
  return rowToProvider(row)
}

export async function dbUpdateProvider(
  id: string,
  payload: Partial<ReturnType<typeof rowToProvider>>
): Promise<ReturnType<typeof rowToProvider> | null> {
  const ts = now()
  const data: Record<string, unknown> = { updatedAt: ts }
  if (payload.name !== undefined) data.name = payload.name
  if (payload.nameZh !== undefined) data.nameZh = payload.nameZh
  if (payload.providerType !== undefined) data.providerType = payload.providerType
  if (payload.baseUrl !== undefined) data.baseUrl = payload.baseUrl
  if (payload.credentialId !== undefined) data.credentialId = payload.credentialId
  if (payload.status !== undefined) data.status = payload.status
  if (payload.notes !== undefined) data.notes = payload.notes
  await prisma.lLMProvider.update({
    where: { id },
    data: data as Record<string, string | null>,
  })
  return dbGetProviderById(id)
}

export async function dbChangeProviderStatus(
  id: string,
  status: string
): Promise<ReturnType<typeof rowToProvider> | null> {
  return dbUpdateProvider(id, { status })
}

export async function dbDeleteProvider(id: string): Promise<boolean> {
  const configs = await prisma.lLMModelConfig.count({ where: { providerId: id } })
  if (configs > 0) throw new Error('该提供商下存在模型配置，无法删除')
  await prisma.lLMProvider.delete({ where: { id } })
  return true
}

// ─── ModelConfig ─────────────────────────────────────────────────────────────

export async function dbListModelConfigs(providerId?: string): Promise<ReturnType<typeof rowToModelConfig>[]> {
  const where = providerId ? { providerId } : {}
  const rows = await prisma.lLMModelConfig.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
  })
  return rows.map(rowToModelConfig)
}

export async function dbGetModelConfigById(id: string): Promise<ReturnType<typeof rowToModelConfig> | null> {
  const row = await prisma.lLMModelConfig.findUnique({ where: { id } })
  return row ? rowToModelConfig(row) : null
}

export async function dbCreateModelConfig(payload: {
  id?: string
  name: string
  nameZh?: string
  providerId: string
  modelKey: string
  isEnabled?: boolean
  isDefault?: boolean
  temperature?: number
  maxTokens?: number
  timeoutMs?: number
  retryCount?: number
  structuredOutputMode?: string
  fallbackModelConfigId?: string
  supportedAgentCategories?: string[]
  notes?: string
}): Promise<ReturnType<typeof rowToModelConfig>> {
  const ts = now()
  const id = (payload.id?.trim()) || `llm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const row = await prisma.lLMModelConfig.create({
    data: {
      id,
      name: payload.name,
      nameZh: payload.nameZh ?? null,
      providerId: payload.providerId,
      modelKey: payload.modelKey,
      isEnabled: payload.isEnabled ?? true,
      isDefault: payload.isDefault ?? false,
      temperature: payload.temperature ?? 0.7,
      maxTokens: payload.maxTokens ?? 2048,
      timeoutMs: payload.timeoutMs ?? 30000,
      retryCount: payload.retryCount ?? 1,
      structuredOutputMode: payload.structuredOutputMode ?? 'json_object',
      fallbackModelConfigId: payload.fallbackModelConfigId ?? null,
      supportedAgentCategories: payload.supportedAgentCategories
        ? JSON.stringify(payload.supportedAgentCategories)
        : null,
      notes: payload.notes ?? null,
      createdAt: ts,
      updatedAt: ts,
    },
  })
  return rowToModelConfig(row)
}

export async function dbUpdateModelConfig(
  id: string,
  payload: Partial<ReturnType<typeof rowToModelConfig>>
): Promise<ReturnType<typeof rowToModelConfig> | null> {
  const ts = now()
  const data: Record<string, unknown> = { updatedAt: ts }
  const keys = [
    'name',
    'nameZh',
    'providerId',
    'modelKey',
    'isEnabled',
    'isDefault',
    'temperature',
    'maxTokens',
    'timeoutMs',
    'retryCount',
    'structuredOutputMode',
    'fallbackModelConfigId',
    'notes',
  ] as const
  for (const key of keys) {
    if (payload[key] !== undefined) data[key] = payload[key]
  }
  if (payload.supportedAgentCategories !== undefined)
    data.supportedAgentCategories = JSON.stringify(payload.supportedAgentCategories)
  await prisma.lLMModelConfig.update({
    where: { id },
    data: data as Record<string, string | number | boolean | null>,
  })
  return dbGetModelConfigById(id)
}

export async function dbSetModelConfigEnabled(id: string, isEnabled: boolean): Promise<ReturnType<typeof rowToModelConfig> | null> {
  return dbUpdateModelConfig(id, { isEnabled })
}

export async function dbSetDefaultModelConfig(id: string): Promise<ReturnType<typeof rowToModelConfig> | null> {
  const row = await prisma.lLMModelConfig.findUnique({ where: { id } })
  if (!row) return null
  await prisma.$transaction([
    prisma.lLMModelConfig.updateMany({
      where: { providerId: row.providerId },
      data: { isDefault: false },
    }),
    prisma.lLMModelConfig.update({
      where: { id },
      data: { isDefault: true, updatedAt: now() },
    }),
  ])
  return dbGetModelConfigById(id)
}

export async function dbDeleteModelConfig(id: string): Promise<boolean> {
  const bindings = await prisma.agentLLMBinding.count({ where: { modelConfigId: id } })
  if (bindings > 0) throw new Error('该模型配置已被 Agent 绑定，无法删除')
  await prisma.lLMModelConfig.delete({ where: { id } })
  return true
}

// ─── AgentLLMBinding ─────────────────────────────────────────────────────────

export async function dbListBindings(agentTemplateId?: string): Promise<ReturnType<typeof rowToBinding>[]> {
  const where = agentTemplateId ? { agentTemplateId } : {}
  const rows = await prisma.agentLLMBinding.findMany({
    where,
    orderBy: { priority: 'asc' },
  })
  return rows.map(rowToBinding)
}

export async function dbGetBindingById(id: string): Promise<ReturnType<typeof rowToBinding> | null> {
  const row = await prisma.agentLLMBinding.findUnique({ where: { id } })
  return row ? rowToBinding(row) : null
}

export async function dbCreateBinding(payload: {
  agentTemplateId: string
  modelConfigId: string
  bindingType: string
  priority?: number
  isEnabled?: boolean
  notes?: string
}): Promise<ReturnType<typeof rowToBinding>> {
  const ts = now()
  const id = `binding-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const row = await prisma.agentLLMBinding.create({
    data: {
      id,
      agentTemplateId: payload.agentTemplateId,
      modelConfigId: payload.modelConfigId,
      bindingType: payload.bindingType,
      priority: payload.priority ?? 0,
      isEnabled: payload.isEnabled ?? true,
      notes: payload.notes ?? null,
      createdAt: ts,
      updatedAt: ts,
    },
  })
  return rowToBinding(row)
}

export async function dbUpdateBinding(
  id: string,
  payload: Partial<ReturnType<typeof rowToBinding>>
): Promise<ReturnType<typeof rowToBinding> | null> {
  const ts = now()
  const data: Record<string, unknown> = { updatedAt: ts }
  if (payload.modelConfigId !== undefined) data.modelConfigId = payload.modelConfigId
  if (payload.bindingType !== undefined) data.bindingType = payload.bindingType
  if (payload.priority !== undefined) data.priority = payload.priority
  if (payload.isEnabled !== undefined) data.isEnabled = payload.isEnabled
  if (payload.notes !== undefined) data.notes = payload.notes
  await prisma.agentLLMBinding.update({
    where: { id },
    data: data as Record<string, string | number | boolean | null>,
  })
  return dbGetBindingById(id)
}

export async function dbDeleteBinding(id: string): Promise<boolean> {
  await prisma.agentLLMBinding.delete({ where: { id } })
  return true
}

/** 设置 Agent 的主模型绑定：同 Agent 下将原 primary 改为 fallback，再创建新 primary（事务保证原子性） */
export async function dbSetPrimaryBinding(
  agentTemplateId: string,
  modelConfigId: string
): Promise<ReturnType<typeof rowToBinding>> {
  const ts = now()
  const existing = await prisma.agentLLMBinding.findFirst({
    where: { agentTemplateId, bindingType: 'primary', isEnabled: true },
  })
  if (existing && existing.modelConfigId === modelConfigId) return rowToBinding(existing)

  const newId = `binding-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.agentLLMBinding.update({
        where: { id: existing.id },
        data: { bindingType: 'fallback', updatedAt: ts },
      })
    }
    await tx.agentLLMBinding.create({
      data: {
        id: newId,
        agentTemplateId,
        modelConfigId,
        bindingType: 'primary',
        priority: 0,
        isEnabled: true,
        notes: null,
        createdAt: ts,
        updatedAt: ts,
      },
    })
  })

  const created = await prisma.agentLLMBinding.findUnique({ where: { id: newId } })
  if (!created) throw new Error('创建主模型绑定失败')
  return rowToBinding(created)
}
