/**
 * Skill 服务端持久化（批次 7）
 */
import { prisma } from './prismaClient'

const now = (): string => new Date().toISOString().slice(0, 19).replace('T', ' ')

function parseStringArray(s: string | null | undefined): string[] | undefined {
  if (!s) return undefined
  try {
    const arr = JSON.parse(s) as unknown
    return Array.isArray(arr) ? arr.map(String) : undefined
  } catch {
    return undefined
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSkill(row: any) {
  let openClawSpec:
    | { steps?: string[]; inputSchemaJson?: string; outputSchemaJson?: string }
    | undefined
  if (row.openClawSpecJson) {
    try {
      openClawSpec = JSON.parse(row.openClawSpecJson) as typeof openClawSpec
    } catch {
      openClawSpec = undefined
    }
  }
  return {
    id: row.id,
    name: row.name,
    nameZh: row.nameZh ?? undefined,
    code: row.code,
    category: row.category,
    executionType: row.executionType,
    description: row.description ?? undefined,
    version: row.version,
    status: row.status,
    isSystemPreset: row.isSystemPreset,
    openClawSpec,
    inputSchemaJson: row.inputSchemaJson ?? undefined,
    outputSchemaJson: row.outputSchemaJson ?? undefined,
    executionConfigJson: row.executionConfigJson ?? undefined,
    promptTemplate: row.promptTemplate ?? undefined,
    requiredContextFields: parseStringArray(row.requiredContextFields),
    estimatedDurationMs: row.estimatedDurationMs ?? undefined,
    retryable: row.retryable ?? true,
    maxRetries: row.maxRetries ?? 1,
    boundAgentTemplateIds: undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export interface SkillListParams {
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
  category?: string
}

export interface CreateSkillPayload {
  name: string
  nameZh?: string
  code: string
  category: string
  executionType: string
  description?: string
  version?: string
  status?: string
  openClawSpec?: { steps?: string[]; inputSchemaJson?: string; outputSchemaJson?: string }
  inputSchemaJson?: string
  outputSchemaJson?: string
  executionConfigJson?: string
  promptTemplate?: string
  requiredContextFields?: string[]
  estimatedDurationMs?: number
  retryable?: boolean
  maxRetries?: number
}

export interface UpdateSkillPayload {
  name?: string
  nameZh?: string
  description?: string
  category?: string
  executionType?: string
  version?: string
  status?: string
  openClawSpec?: { steps?: string[]; inputSchemaJson?: string; outputSchemaJson?: string }
  inputSchemaJson?: string
  outputSchemaJson?: string
  executionConfigJson?: string
  promptTemplate?: string
  requiredContextFields?: string[]
  estimatedDurationMs?: number
  retryable?: boolean
  maxRetries?: number
}

export async function dbListSkills(params: SkillListParams): Promise<{
  items: ReturnType<typeof rowToSkill>[]
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

  const [items, total] = await Promise.all([
    prisma.skill.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.skill.count({ where }),
  ])
  return {
    items: items.map(rowToSkill),
    total,
  }
}

export async function dbGetSkillById(id: string): Promise<ReturnType<typeof rowToSkill> | null> {
  const row = await prisma.skill.findUnique({ where: { id } })
  return row ? rowToSkill(row) : null
}

export async function dbCreateSkill(payload: CreateSkillPayload): Promise<ReturnType<typeof rowToSkill>> {
  const ts = now()
  const id = `skill-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const row = await prisma.skill.create({
    data: {
      id,
      name: payload.name,
      nameZh: payload.nameZh ?? null,
      code: payload.code,
      category: payload.category,
      executionType: payload.executionType,
      description: payload.description ?? null,
      version: payload.version ?? '1.0.0',
      status: payload.status ?? 'active',
      isSystemPreset: false,
      openClawSpecJson: payload.openClawSpec ? JSON.stringify(payload.openClawSpec) : null,
      inputSchemaJson: payload.inputSchemaJson ?? null,
      outputSchemaJson: payload.outputSchemaJson ?? null,
      executionConfigJson: payload.executionConfigJson ?? null,
      promptTemplate: payload.promptTemplate ?? null,
      requiredContextFields: payload.requiredContextFields
        ? JSON.stringify(payload.requiredContextFields)
        : null,
      estimatedDurationMs: payload.estimatedDurationMs ?? null,
      retryable: payload.retryable ?? true,
      maxRetries: payload.maxRetries ?? 1,
      createdAt: ts,
      updatedAt: ts,
    },
  })
  return rowToSkill(row)
}

export async function dbUpdateSkill(
  id: string,
  payload: UpdateSkillPayload
): Promise<ReturnType<typeof rowToSkill> | null> {
  const ts = now()
  const data: Record<string, unknown> = { updatedAt: ts }
  if (payload.name !== undefined) data.name = payload.name
  if (payload.nameZh !== undefined) data.nameZh = payload.nameZh
  if (payload.description !== undefined) data.description = payload.description
  if (payload.category !== undefined) data.category = payload.category
  if (payload.executionType !== undefined) data.executionType = payload.executionType
  if (payload.version !== undefined) data.version = payload.version
  if (payload.status !== undefined) data.status = payload.status
  if (payload.openClawSpec !== undefined)
    data.openClawSpecJson = payload.openClawSpec ? JSON.stringify(payload.openClawSpec) : null
  if (payload.inputSchemaJson !== undefined) data.inputSchemaJson = payload.inputSchemaJson
  if (payload.outputSchemaJson !== undefined) data.outputSchemaJson = payload.outputSchemaJson
  if (payload.executionConfigJson !== undefined) data.executionConfigJson = payload.executionConfigJson
  if (payload.promptTemplate !== undefined) data.promptTemplate = payload.promptTemplate
  if (payload.requiredContextFields !== undefined)
    data.requiredContextFields = JSON.stringify(payload.requiredContextFields)
  if (payload.estimatedDurationMs !== undefined) data.estimatedDurationMs = payload.estimatedDurationMs
  if (payload.retryable !== undefined) data.retryable = payload.retryable
  if (payload.maxRetries !== undefined) data.maxRetries = payload.maxRetries
  await prisma.skill.update({
    where: { id },
    data: data as Record<string, string | number | boolean | null>,
  })
  return dbGetSkillById(id)
}

export async function dbChangeSkillStatus(
  id: string,
  status: string
): Promise<ReturnType<typeof rowToSkill> | null> {
  return dbUpdateSkill(id, { status })
}

export async function dbDeleteSkill(id: string): Promise<boolean> {
  await prisma.skill.delete({ where: { id } })
  return true
}
