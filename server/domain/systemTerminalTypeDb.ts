/**
 * 终端类型工厂服务端持久化（批次 8）
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
function rowToSystemTerminalType(row: any) {
  const code = row.code as string
  return {
    id: row.id,
    name: row.name,
    nameZh: row.nameZh,
    code,
    typeCategory: row.typeCategory,
    icon: row.icon ?? undefined,
    description: row.description ?? undefined,
    authType: code === 'facebook_page' ? 'oauth_facebook' : ('manual' as const),
    authSchema: row.authSchema ?? undefined,
    configSchema: row.configSchema ?? undefined,
    supportedProjectTypeIds: parseJsonArray(row.supportedProjectTypeIds),
    capabilityTags: parseJsonArray(row.capabilityTags),
    status: row.status,
    isSystemPreset: row.isSystemPreset,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export type SystemTerminalTypeRow = ReturnType<typeof rowToSystemTerminalType>

export interface SystemTerminalTypeListParams {
  page?: number
  pageSize?: number
  keyword?: string
  typeCategory?: string
  status?: string
}

export interface CreateSystemTerminalTypePayload {
  name: string
  nameZh: string
  code: string
  typeCategory: string
  icon?: string
  description?: string
  authSchema?: string
  configSchema?: string
  supportedProjectTypeIds?: string[]
  capabilityTags?: string[]
  status?: string
  isSystemPreset?: boolean
  version?: string
}

export async function dbListSystemTerminalTypes(
  params: SystemTerminalTypeListParams
): Promise<{ items: SystemTerminalTypeRow[]; total: number }> {
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
  if (params.typeCategory) where.typeCategory = params.typeCategory
  if (params.status) where.status = params.status

  const [rows, total] = await Promise.all([
    prisma.systemTerminalType.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.systemTerminalType.count({ where }),
  ])
  const items = rows.map((row) => rowToSystemTerminalType(row))
  const instanceCounts = await Promise.all(
    items.map((item) => prisma.terminal.count({ where: { type: item.code } }))
  )
  items.forEach((item, i) => {
    (item as SystemTerminalTypeRow & { instanceCount?: number }).instanceCount = instanceCounts[i]
  })
  return { items, total }
}

export async function dbGetSystemTerminalTypeById(
  id: string
): Promise<SystemTerminalTypeRow | null> {
  const row = await prisma.systemTerminalType.findUnique({ where: { id } })
  return row ? rowToSystemTerminalType(row) : null
}

export async function dbGetSystemTerminalTypeByCode(
  code: string
): Promise<SystemTerminalTypeRow | null> {
  const row = await prisma.systemTerminalType.findUnique({ where: { code } })
  return row ? rowToSystemTerminalType(row) : null
}

export async function dbCreateSystemTerminalType(
  payload: CreateSystemTerminalTypePayload & { id?: string }
): Promise<SystemTerminalTypeRow> {
  const ts = now()
  const id = payload.id ?? `stt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const row = await prisma.systemTerminalType.create({
    data: {
      id,
      name: payload.name,
      nameZh: payload.nameZh,
      code: payload.code,
      typeCategory: payload.typeCategory,
      icon: payload.icon ?? null,
      description: payload.description ?? null,
      authSchema: payload.authSchema ?? null,
      configSchema: payload.configSchema ?? null,
      supportedProjectTypeIds: payload.supportedProjectTypeIds
        ? JSON.stringify(payload.supportedProjectTypeIds)
        : null,
      capabilityTags: payload.capabilityTags ? JSON.stringify(payload.capabilityTags) : null,
      status: payload.status ?? 'active',
      isSystemPreset: payload.isSystemPreset ?? false,
      version: payload.version ?? '1.0',
      createdAt: ts,
      updatedAt: ts,
    },
  })
  return rowToSystemTerminalType(row)
}

export async function dbUpdateSystemTerminalType(
  id: string,
  payload: Partial<CreateSystemTerminalTypePayload>
): Promise<SystemTerminalTypeRow | null> {
  const existing = await prisma.systemTerminalType.findUnique({ where: { id } })
  if (!existing) return null
  const ts = now()
  const data: Record<string, unknown> = {
    updatedAt: ts,
  }
  if (payload.name !== undefined) data.name = payload.name
  if (payload.nameZh !== undefined) data.nameZh = payload.nameZh
  if (payload.code !== undefined) data.code = payload.code
  if (payload.typeCategory !== undefined) data.typeCategory = payload.typeCategory
  if (payload.icon !== undefined) data.icon = payload.icon
  if (payload.description !== undefined) data.description = payload.description
  if (payload.authSchema !== undefined) data.authSchema = payload.authSchema
  if (payload.configSchema !== undefined) data.configSchema = payload.configSchema
  if (payload.supportedProjectTypeIds !== undefined)
    data.supportedProjectTypeIds = JSON.stringify(payload.supportedProjectTypeIds)
  if (payload.capabilityTags !== undefined)
    data.capabilityTags = JSON.stringify(payload.capabilityTags)
  if (payload.status !== undefined) data.status = payload.status
  if (payload.isSystemPreset !== undefined) data.isSystemPreset = payload.isSystemPreset
  if (payload.version !== undefined) data.version = payload.version

  await prisma.systemTerminalType.update({
    where: { id },
    data: data as Record<string, string | number | boolean | null>,
  })
  return dbGetSystemTerminalTypeById(id)
}

export async function dbChangeSystemTerminalTypeStatus(
  id: string,
  status: string
): Promise<SystemTerminalTypeRow | null> {
  return dbUpdateSystemTerminalType(id, { status })
}

export async function dbDeleteSystemTerminalType(id: string): Promise<boolean> {
  const row = await prisma.systemTerminalType.findUnique({ where: { id } })
  if (!row) return false
  const count = await prisma.terminal.count({ where: { type: row.code } })
  if (count > 0) {
    throw new Error(`该终端类型已被 ${count} 个终端实例使用，无法删除`)
  }
  await prisma.systemTerminalType.delete({ where: { id } })
  return true
}

/** 获取某终端类型的租户使用数及实例列表摘要 */
export async function dbGetSystemTerminalTypeUsage(code: string): Promise<{
  instanceCount: number
  instances: { id: string; tenantId: string; name: string; status: string; createdAt: string }[]
}> {
  const terminals = await prisma.terminal.findMany({
    where: { type: code },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return {
    instanceCount: await prisma.terminal.count({ where: { type: code } }),
    instances: terminals.map((t) => ({
      id: t.id,
      tenantId: t.tenantId,
      name: t.name,
      status: t.status,
      createdAt: t.createdAt,
    })),
  }
}
