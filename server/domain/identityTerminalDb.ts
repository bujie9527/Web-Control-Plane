/**
 * Identity / Terminal 服务端持久化（批次 3）
 */
import { prisma } from './prismaClient'

const now = (): string => new Date().toISOString().slice(0, 19).replace('T', ' ')

// ─── Identity ─────────────────────────────────────────────────────────────────

export async function dbListIdentities(params: {
  tenantId: string
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
  type?: string
}) {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 10
  const skip = (page - 1) * pageSize
  const where: Record<string, unknown> = { tenantId: params.tenantId }
  if (params.status) where.status = params.status
  if (params.type) where.type = params.type
  if (params.keyword?.trim()) {
    where.OR = [
      { name: { contains: params.keyword } },
      { corePositioning: { contains: params.keyword } },
    ] as unknown[]
  }
  const [items, total] = await Promise.all([
    prisma.identity.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.identity.count({ where }),
  ])
  return {
    items: items.map((row) => ({
      id: row.id,
      tenantId: row.tenantId,
      name: row.name,
      type: row.type as 'brand_official' | 'koc' | 'expert' | 'assistant' | 'other',
      corePositioning: row.corePositioning ?? '',
      toneStyle: row.toneStyle ?? '',
      contentDirections: row.contentDirections ?? '',
      behaviorRules: row.behaviorRules ?? '',
      platformAdaptations: row.platformAdaptations
        ? (JSON.parse(row.platformAdaptations) as Record<string, string>)
        : {},
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })),
    total,
  }
}

export async function dbGetIdentityById(id: string) {
  const row = await prisma.identity.findUnique({ where: { id } })
  if (!row) return null
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    type: row.type as 'brand_official' | 'koc' | 'expert' | 'assistant' | 'other',
    corePositioning: row.corePositioning ?? '',
    toneStyle: row.toneStyle ?? '',
    contentDirections: row.contentDirections ?? '',
    behaviorRules: row.behaviorRules ?? '',
    platformAdaptations: row.platformAdaptations
      ? (JSON.parse(row.platformAdaptations) as Record<string, string>)
      : {},
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function dbCreateIdentity(payload: {
  tenantId: string
  name: string
  type?: string
  corePositioning?: string
  toneStyle?: string
  contentDirections?: string
  behaviorRules?: string
  platformAdaptations?: Record<string, string>
  status?: string
}) {
  const ts = now()
  const row = await prisma.identity.create({
    data: {
      tenantId: payload.tenantId,
      name: payload.name,
      type: payload.type ?? null,
      corePositioning: payload.corePositioning ?? null,
      toneStyle: payload.toneStyle ?? null,
      contentDirections: payload.contentDirections ?? null,
      behaviorRules: payload.behaviorRules ?? null,
      platformAdaptations: payload.platformAdaptations
        ? JSON.stringify(payload.platformAdaptations)
        : null,
      status: payload.status ?? 'active',
      createdAt: ts,
      updatedAt: ts,
    },
  })
  return dbGetIdentityById(row.id) as Promise<NonNullable<Awaited<ReturnType<typeof dbGetIdentityById>>>>
}

export async function dbUpdateIdentity(id: string, payload: Record<string, unknown>) {
  const ts = now()
  const data: Record<string, unknown> = { updatedAt: ts }
  if (payload.name !== undefined) data.name = payload.name
  if (payload.type !== undefined) data.type = payload.type
  if (payload.corePositioning !== undefined) data.corePositioning = payload.corePositioning
  if (payload.toneStyle !== undefined) data.toneStyle = payload.toneStyle
  if (payload.contentDirections !== undefined) data.contentDirections = payload.contentDirections
  if (payload.behaviorRules !== undefined) data.behaviorRules = payload.behaviorRules
  if (payload.platformAdaptations !== undefined)
    data.platformAdaptations = JSON.stringify(payload.platformAdaptations)
  if (payload.status !== undefined) data.status = payload.status
  await prisma.identity.update({ where: { id }, data: data as Record<string, string | null> })
  return dbGetIdentityById(id) as Promise<NonNullable<Awaited<ReturnType<typeof dbGetIdentityById>>>>
}

export async function dbDeleteIdentity(id: string) {
  await prisma.identity.delete({ where: { id } })
  return true
}

export async function dbPatchIdentityStatus(id: string, status: string) {
  await prisma.identity.update({ where: { id }, data: { status, updatedAt: now() } })
  return dbGetIdentityById(id) as Promise<NonNullable<Awaited<ReturnType<typeof dbGetIdentityById>>>>
}

// ─── Terminal ─────────────────────────────────────────────────────────────────

function parseJsonArray(s: string | null): string[] {
  if (!s?.trim()) return []
  try {
    const a = JSON.parse(s) as unknown
    return Array.isArray(a) ? a.map(String) : []
  } catch {
    return []
  }
}

function rowToTerminal(row: {
  id: string
  tenantId: string
  name: string
  type: string | null
  typeCategory: string | null
  identityId: string | null
  status: string
  credentialsJson: string | null
  configJson: string | null
  linkedProjectIds: string | null
  lastTestedAt: string | null
  lastTestResult: string | null
  lastTestMessage: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}) {
  return {
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    type: row.type ?? '',
    typeCategory: (row.typeCategory ?? undefined) as 'api' | 'browser' | 'mcp' | undefined,
    identityId: row.identityId ?? undefined,
    status: row.status,
    credentialsJson: row.credentialsJson ?? undefined,
    configJson: row.configJson ?? undefined,
    linkedProjectIds: parseJsonArray(row.linkedProjectIds),
    lastTestedAt: row.lastTestedAt ?? undefined,
    lastTestResult: (row.lastTestResult ?? undefined) as 'success' | 'failed' | 'unknown' | undefined,
    lastTestMessage: row.lastTestMessage ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function dbListTerminals(params: {
  tenantId?: string
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
  type?: string
  typeCategory?: string
}) {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const skip = (page - 1) * pageSize
  const where: Record<string, unknown> = {}
  if (params.tenantId) where.tenantId = params.tenantId
  if (params.status) where.status = params.status
  if (params.type) where.type = params.type
  if (params.typeCategory) where.typeCategory = params.typeCategory
  if (params.keyword?.trim()) {
    where.OR = [
      { name: { contains: params.keyword } },
      { type: { contains: params.keyword } },
    ] as unknown[]
  }
  const [items, total] = await Promise.all([
    prisma.terminal.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.terminal.count({ where }),
  ])
  return {
    items: items.map((row) => rowToTerminal(row)),
    total,
  }
}

export async function dbGetTerminalById(id: string) {
  const row = await prisma.terminal.findUnique({ where: { id } })
  if (!row) return null
  return rowToTerminal(row)
}

export async function dbCreateTerminal(payload: {
  tenantId: string
  name: string
  type: string
  typeCategory?: string
  identityId?: string
  status?: string
  credentialsJson?: string
  configJson?: string
  linkedProjectIds?: string[]
  notes?: string
}) {
  const ts = now()
  const row = await prisma.terminal.create({
    data: {
      tenantId: payload.tenantId,
      name: payload.name,
      type: payload.type,
      typeCategory: payload.typeCategory ?? null,
      identityId: payload.identityId ?? null,
      status: payload.status ?? 'active',
      credentialsJson: payload.credentialsJson ?? null,
      configJson: payload.configJson ?? null,
      linkedProjectIds: payload.linkedProjectIds?.length
        ? JSON.stringify(payload.linkedProjectIds)
        : null,
      notes: payload.notes ?? null,
      createdAt: ts,
      updatedAt: ts,
    },
  })
  return rowToTerminal(row)
}

export async function dbUpdateTerminal(
  id: string,
  payload: {
    name?: string
    identityId?: string | null
    status?: string
    credentialsJson?: string
    configJson?: string
    linkedProjectIds?: string[]
    notes?: string
  }
) {
  const ts = now()
  const data: Record<string, unknown> = { updatedAt: ts }
  if (payload.name !== undefined) data.name = payload.name
  if (payload.identityId !== undefined) data.identityId = payload.identityId ?? null
  if (payload.status !== undefined) data.status = payload.status
  if (payload.credentialsJson !== undefined) data.credentialsJson = payload.credentialsJson ?? null
  if (payload.configJson !== undefined) data.configJson = payload.configJson ?? null
  if (payload.linkedProjectIds !== undefined)
    data.linkedProjectIds = payload.linkedProjectIds?.length ? JSON.stringify(payload.linkedProjectIds) : null
  if (payload.notes !== undefined) data.notes = payload.notes ?? null
  await prisma.terminal.update({ where: { id }, data: data as Record<string, string | null> })
  return dbGetTerminalById(id) as Promise<NonNullable<Awaited<ReturnType<typeof dbGetTerminalById>>>>
}

export async function dbDeleteTerminal(id: string) {
  await prisma.terminal.delete({ where: { id } })
  return true
}

export async function dbPatchTerminalStatus(id: string, status: string) {
  const ts = now()
  await prisma.terminal.update({ where: { id }, data: { status, updatedAt: ts } })
  return dbGetTerminalById(id) as Promise<NonNullable<Awaited<ReturnType<typeof dbGetTerminalById>>>>
}

export async function dbSetTerminalTestResult(
  id: string,
  result: { lastTestResult: 'success' | 'failed' | 'unknown'; lastTestMessage?: string }
) {
  const ts = now()
  await prisma.terminal.update({
    where: { id },
    data: {
      lastTestedAt: ts,
      lastTestResult: result.lastTestResult,
      lastTestMessage: result.lastTestMessage ?? null,
      updatedAt: ts,
    },
  })
  return dbGetTerminalById(id) as Promise<NonNullable<Awaited<ReturnType<typeof dbGetTerminalById>>>>
}
