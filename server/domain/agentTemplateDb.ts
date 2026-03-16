/**
 * AgentTemplate 服务端持久化（批次 7）
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

function parseJsonObject<T extends Record<string, unknown>>(s: string | null): T | undefined {
  if (!s) return undefined
  try {
    const o = JSON.parse(s) as unknown
    return o && typeof o === 'object' ? (o as T) : undefined
  } catch {
    return undefined
  }
}

const VALID_PLATFORM_TYPES = new Set<string>([
  'general',
  'facebook',
  'x',
  'tiktok',
  'instagram',
  'wechat',
])

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToAgentTemplate(row: any) {
  const sceneTags = parseJsonArray(row.sceneTags)
  const changeSummary = parseJsonArray(row.changeSummary)
  const supportedProjectTypeIds = parseJsonArray(row.supportedProjectTypeIds)
  const supportedGoalTypeIds = parseJsonArray(row.supportedGoalTypeIds)
  const supportedSkillIds = parseJsonArray(row.supportedSkillIds)
  const allowedExecutorTypes = parseJsonArray(row.allowedExecutorTypes)
  const allowedTerminalTypes = parseJsonArray(row.allowedTerminalTypes)
  const fallbackModelKeys = parseJsonArray(row.fallbackModelKeys)
  const channelStyleProfiles = parseJsonObject<Record<string, unknown>>(row.channelStyleProfiles ?? null)

  const rawPlatform = row.platformType ?? undefined
  const platformType =
    typeof rawPlatform === 'string' && VALID_PLATFORM_TYPES.has(rawPlatform)
      ? rawPlatform
      : undefined
  if (typeof rawPlatform === 'string' && rawPlatform && !VALID_PLATFORM_TYPES.has(rawPlatform)) {
    console.warn('[agentTemplateDb] invalid platformType:', rawPlatform)
  }

  return {
    id: row.id,
    name: row.name,
    nameZh: row.nameZh ?? undefined,
    code: row.code,
    description: row.description ?? undefined,
    roleType: row.roleType,
    category: row.category ?? undefined,
    domain: row.domain ?? undefined,
    sceneTags: sceneTags.length ? sceneTags : undefined,
    platformType,
    archetypeCode: row.archetypeCode ?? undefined,
    parentTemplateId: row.parentTemplateId ?? undefined,
    sourceTemplateId: row.sourceTemplateId ?? undefined,
    sourceVersion: row.sourceVersion ?? undefined,
    plannerDomain: row.plannerDomain ?? undefined,
    plannerTier: row.plannerTier ?? undefined,
    changeSummary: changeSummary.length ? changeSummary : undefined,
    capabilityNotes: row.capabilityNotes ?? row.notes ?? undefined,
    status: row.status,
    version: String(row.version),
    isLatest: row.isLatest,
    isSystemPreset: row.isSystemPreset,
    isCloneable: row.isCloneable,
    supportedProjectTypeIds: supportedProjectTypeIds.length ? supportedProjectTypeIds : undefined,
    supportedGoalTypeIds: supportedGoalTypeIds.length ? supportedGoalTypeIds : undefined,
    supportedSkillIds: supportedSkillIds.length ? supportedSkillIds : undefined,
    defaultExecutorType: row.defaultExecutorType,
    allowedExecutorTypes: allowedExecutorTypes.length ? allowedExecutorTypes : undefined,
    allowedTerminalTypes: allowedTerminalTypes.length ? allowedTerminalTypes : undefined,
    defaultModelKey: row.defaultModelKey ?? undefined,
    fallbackModelKeys: fallbackModelKeys.length ? fallbackModelKeys : undefined,
    temperature: row.temperature ?? undefined,
    maxTokens: row.maxTokens ?? undefined,
    systemPromptTemplate: row.systemPromptTemplate ?? undefined,
    instructionTemplate: row.instructionTemplate ?? undefined,
    outputFormat: row.outputFormat ?? undefined,
    channelStyleProfiles: channelStyleProfiles ?? undefined,
    requireGoalContext: row.requireGoalContext ?? false,
    requireIdentityContext: row.requireIdentityContext ?? false,
    requireSOPContext: row.requireSOPContext ?? false,
    requireStructuredOutput: row.requireStructuredOutput ?? false,
    disallowDirectTerminalAction: row.disallowDirectTerminalAction ?? true,
    requireHumanReview: row.requireHumanReview ?? false,
    requireNodeReview: row.requireNodeReview ?? false,
    autoApproveWhenConfidenceGte: row.autoApproveWhenConfidenceGte ?? undefined,
    manual: row.manual ?? true,
    semi_auto: row.semi_auto ?? true,
    full_auto: row.full_auto ?? false,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export interface AgentTemplateListParams {
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
  category?: string
  domain?: string
  roleType?: string
  isSystemPreset?: boolean
  platformType?: string
}

export interface CreateAgentTemplatePayload {
  name: string
  code: string
  description?: string
  roleType: string
  category?: string
  domain?: string
  sceneTags?: string[]
  platformType?: string
  archetypeCode?: string
  parentTemplateId?: string
  supportedProjectTypeIds?: string[]
  supportedGoalTypeIds?: string[]
  supportedSkillIds?: string[]
  defaultExecutorType: string
  allowedExecutorTypes?: string[]
  allowedTerminalTypes?: string[]
  defaultModelKey?: string
  fallbackModelKeys?: string[]
  temperature?: number
  maxTokens?: number
  systemPromptTemplate?: string
  instructionTemplate?: string
  outputFormat?: string
  channelStyleProfiles?: Record<string, unknown>
  requireGoalContext?: boolean
  requireIdentityContext?: boolean
  requireSOPContext?: boolean
  requireStructuredOutput?: boolean
  disallowDirectTerminalAction?: boolean
  requireHumanReview?: boolean
  requireNodeReview?: boolean
  autoApproveWhenConfidenceGte?: number
  manual?: boolean
  semi_auto?: boolean
  full_auto?: boolean
}

export interface CloneAgentTemplatePayload {
  name: string
  code: string
  category?: string
  domain?: string
  sceneTags?: string[]
  inheritSkills?: boolean
  inheritModelConfig?: boolean
  inheritGuardrails?: boolean
  inheritReviewPolicy?: boolean
}

export async function dbListAgentTemplates(params: AgentTemplateListParams): Promise<{
  items: ReturnType<typeof rowToAgentTemplate>[]
  total: number
}> {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const skip = (page - 1) * pageSize
  const where: Record<string, unknown> = {}
  if (params.keyword?.trim()) {
    const k = params.keyword.trim().toLowerCase()
    where.OR = [
      { name: { contains: k } },
      { nameZh: { contains: k } },
      { code: { contains: k } },
      { description: { contains: k } },
    ]
  }
  if (params.status) where.status = params.status
  if (params.category) where.category = params.category
  if (params.domain) where.domain = params.domain
  if (params.roleType) where.roleType = params.roleType
  if (typeof params.isSystemPreset === 'boolean') where.isSystemPreset = params.isSystemPreset
  if (params.platformType) where.platformType = params.platformType

  const [items, total] = await Promise.all([
    prisma.agentTemplate.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.agentTemplate.count({ where }),
  ])
  return {
    items: items.map(rowToAgentTemplate),
    total,
  }
}

export async function dbGetAgentTemplateById(id: string): Promise<ReturnType<typeof rowToAgentTemplate> | null> {
  const row = await prisma.agentTemplate.findUnique({ where: { id } })
  return row ? rowToAgentTemplate(row) : null
}

export async function dbCreateAgentTemplate(
  payload: CreateAgentTemplatePayload
): Promise<ReturnType<typeof rowToAgentTemplate>> {
  const ts = now()
  const id = `at-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const row = await prisma.agentTemplate.create({
    data: {
      id,
      name: payload.name,
      nameZh: undefined,
      code: payload.code,
      description: payload.description ?? null,
      roleType: payload.roleType,
      category: payload.category ?? null,
      domain: payload.domain ?? null,
      sceneTags: payload.sceneTags ? JSON.stringify(payload.sceneTags) : null,
      platformType: payload.platformType ?? null,
      archetypeCode: payload.archetypeCode ?? null,
      parentTemplateId: payload.parentTemplateId ?? null,
      sourceTemplateId: null,
      sourceVersion: null,
      status: 'draft',
      version: 1,
      isLatest: true,
      isSystemPreset: false,
      isCloneable: true,
      supportedProjectTypeIds: payload.supportedProjectTypeIds
        ? JSON.stringify(payload.supportedProjectTypeIds)
        : null,
      supportedGoalTypeIds: payload.supportedGoalTypeIds ? JSON.stringify(payload.supportedGoalTypeIds) : null,
      supportedSkillIds: payload.supportedSkillIds ? JSON.stringify(payload.supportedSkillIds) : null,
      defaultExecutorType: payload.defaultExecutorType ?? 'agent',
      allowedExecutorTypes: payload.allowedExecutorTypes ? JSON.stringify(payload.allowedExecutorTypes) : null,
      allowedTerminalTypes: payload.allowedTerminalTypes ? JSON.stringify(payload.allowedTerminalTypes) : null,
      defaultModelKey: payload.defaultModelKey ?? null,
      fallbackModelKeys: payload.fallbackModelKeys ? JSON.stringify(payload.fallbackModelKeys) : null,
      temperature: payload.temperature ?? null,
      maxTokens: payload.maxTokens ?? null,
      systemPromptTemplate: payload.systemPromptTemplate ?? null,
      instructionTemplate: payload.instructionTemplate ?? null,
      outputFormat: payload.outputFormat ?? null,
      channelStyleProfiles: payload.channelStyleProfiles
        ? JSON.stringify(payload.channelStyleProfiles)
        : null,
      requireGoalContext: payload.requireGoalContext ?? true,
      requireIdentityContext: payload.requireIdentityContext ?? true,
      requireSOPContext: payload.requireSOPContext ?? false,
      requireStructuredOutput: payload.requireStructuredOutput ?? true,
      disallowDirectTerminalAction: payload.disallowDirectTerminalAction ?? true,
      requireHumanReview: payload.requireHumanReview ?? true,
      requireNodeReview: payload.requireNodeReview ?? false,
      autoApproveWhenConfidenceGte: payload.autoApproveWhenConfidenceGte ?? null,
      plannerDomain: null,
      plannerTier: null,
      changeSummary: null,
      capabilityNotes: null,
      notes: null,
      manual: payload.manual ?? true,
      semi_auto: payload.semi_auto ?? true,
      full_auto: payload.full_auto ?? false,
      createdAt: ts,
      updatedAt: ts,
    },
  })
  return rowToAgentTemplate(row)
}

export async function dbUpdateAgentTemplate(
  id: string,
  payload: Record<string, unknown>
): Promise<ReturnType<typeof rowToAgentTemplate> | null> {
  const ts = now()
  const data: Record<string, unknown> = { updatedAt: ts }
  const arrayFields = [
    'sceneTags',
    'supportedProjectTypeIds',
    'supportedGoalTypeIds',
    'supportedSkillIds',
    'allowedExecutorTypes',
    'allowedTerminalTypes',
    'fallbackModelKeys',
    'changeSummary',
  ]
  const stringFields = [
    'name',
    'nameZh',
    'code',
    'description',
    'roleType',
    'category',
    'domain',
    'platformType',
    'archetypeCode',
    'parentTemplateId',
    'sourceTemplateId',
    'sourceVersion',
    'status',
    'defaultExecutorType',
    'defaultModelKey',
    'systemPromptTemplate',
    'instructionTemplate',
    'outputFormat',
    'plannerDomain',
    'plannerTier',
    'capabilityNotes',
    'notes',
  ]
  const numberFields = ['version', 'temperature', 'maxTokens', 'autoApproveWhenConfidenceGte']
  const boolFields = [
    'isLatest',
    'isSystemPreset',
    'isCloneable',
    'requireGoalContext',
    'requireIdentityContext',
    'requireSOPContext',
    'requireStructuredOutput',
    'disallowDirectTerminalAction',
    'requireHumanReview',
    'requireNodeReview',
    'manual',
    'semi_auto',
    'full_auto',
  ]
  for (const key of arrayFields) {
    if (payload[key] !== undefined)
      data[key] = Array.isArray(payload[key]) ? JSON.stringify(payload[key]) : null
  }
  if (payload.channelStyleProfiles !== undefined) {
    data.channelStyleProfiles = payload.channelStyleProfiles
      ? JSON.stringify(payload.channelStyleProfiles)
      : null
  }
  for (const key of stringFields) {
    if (payload[key] !== undefined) data[key] = payload[key]
  }
  for (const key of numberFields) {
    if (payload[key] !== undefined) data[key] = payload[key]
  }
  for (const key of boolFields) {
    if (payload[key] !== undefined) data[key] = payload[key]
  }
  await prisma.agentTemplate.update({
    where: { id },
    data: data as Record<string, string | number | boolean | null>,
  })
  return dbGetAgentTemplateById(id)
}

export async function dbCloneAgentTemplate(
  sourceId: string,
  payload: CloneAgentTemplatePayload
): Promise<ReturnType<typeof rowToAgentTemplate> | null> {
  const source = await dbGetAgentTemplateById(sourceId)
  if (!source || !source.isCloneable) return null

  const inheritSkills = payload.inheritSkills ?? true
  const inheritModelConfig = payload.inheritModelConfig ?? true
  const inheritGuardrails = payload.inheritGuardrails ?? true
  const inheritReviewPolicy = payload.inheritReviewPolicy ?? true

  const createPayload: CreateAgentTemplatePayload = {
    name: payload.name.trim(),
    code: payload.code.trim().toUpperCase().replace(/\s+/g, '_'),
    description: source.description,
    roleType: source.roleType,
    category: payload.category?.trim() || source.category,
    domain: payload.domain?.trim() || source.domain,
    sceneTags: payload.sceneTags?.length ? payload.sceneTags : source.sceneTags,
    platformType: source.platformType,
    archetypeCode: source.archetypeCode,
    parentTemplateId: source.id,
    supportedProjectTypeIds: inheritSkills ? source.supportedProjectTypeIds : undefined,
    supportedGoalTypeIds: inheritSkills ? source.supportedGoalTypeIds : undefined,
    supportedSkillIds: inheritSkills ? source.supportedSkillIds : undefined,
    defaultExecutorType: source.defaultExecutorType,
    allowedExecutorTypes: source.allowedExecutorTypes,
    allowedTerminalTypes: source.allowedTerminalTypes,
    defaultModelKey: inheritModelConfig ? source.defaultModelKey : undefined,
    fallbackModelKeys: inheritModelConfig ? source.fallbackModelKeys : undefined,
    temperature: inheritModelConfig ? source.temperature : undefined,
    maxTokens: inheritModelConfig ? source.maxTokens : undefined,
    systemPromptTemplate: source.systemPromptTemplate,
    instructionTemplate: source.instructionTemplate,
    outputFormat: source.outputFormat,
    requireGoalContext: inheritGuardrails ? source.requireGoalContext : true,
    requireIdentityContext: inheritGuardrails ? source.requireIdentityContext : true,
    requireSOPContext: inheritGuardrails ? source.requireSOPContext : false,
    requireStructuredOutput: inheritGuardrails ? source.requireStructuredOutput : true,
    disallowDirectTerminalAction: inheritGuardrails ? source.disallowDirectTerminalAction : true,
    requireHumanReview: inheritReviewPolicy ? source.requireHumanReview : true,
    requireNodeReview: inheritReviewPolicy ? source.requireNodeReview : false,
    autoApproveWhenConfidenceGte: inheritReviewPolicy ? source.autoApproveWhenConfidenceGte : undefined,
    manual: source.manual,
    semi_auto: source.semi_auto,
    full_auto: source.full_auto,
  }
  const created = await dbCreateAgentTemplate(createPayload)
  await prisma.agentTemplate.update({
    where: { id: created.id },
    data: {
      sourceTemplateId: source.id,
      sourceVersion: source.version,
      updatedAt: now(),
    },
  })
  return dbGetAgentTemplateById(created.id)
}

export async function dbChangeAgentTemplateStatus(
  id: string,
  status: string
): Promise<ReturnType<typeof rowToAgentTemplate> | null> {
  return dbUpdateAgentTemplate(id, { status })
}

export async function dbDeleteAgentTemplate(id: string): Promise<boolean> {
  const row = await prisma.agentTemplate.findUnique({
    where: { id },
    select: { isSystemPreset: true },
  })
  if (!row) return false
  if (row.isSystemPreset) {
    throw new Error('系统预置模板不可删除')
  }

  const [templateNodeRefs, runningInstanceNodeRefs, projectConfigRefs] = await Promise.all([
    prisma.workflowTemplateNode.count({ where: { recommendedAgentTemplateId: id } }),
    prisma.workflowInstanceNode.count({
      where: {
        selectedAgentTemplateId: id,
        status: { in: ['pending', 'running', 'waiting_review'] },
      },
    }),
    prisma.projectAgentConfig.count({ where: { agentTemplateId: id } }),
  ])

  if (templateNodeRefs > 0) {
    throw new Error(`该模板被 ${templateNodeRefs} 个流程节点引用，请先解绑后再删除`)
  }
  if (runningInstanceNodeRefs > 0) {
    throw new Error(`该模板有 ${runningInstanceNodeRefs} 个运行中的流程实例，请等待完成或终止后再删除`)
  }
  if (projectConfigRefs > 0) {
    throw new Error(`该模板被 ${projectConfigRefs} 个项目使用，请先移除项目绑定`)
  }

  await prisma.agentLLMBinding.deleteMany({ where: { agentTemplateId: id } })
  await prisma.agentTemplate.delete({ where: { id } })
  return true
}
