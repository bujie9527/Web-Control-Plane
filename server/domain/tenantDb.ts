/**
 * Tenant 服务端持久化（批次 6）
 */
import { prisma } from './prismaClient'

const now = (): string => new Date().toISOString().slice(0, 19).replace('T', ' ')

function rowToTenant(row: {
  id: string
  name: string
  code: string | null
  status: string
  createdAt: string
  updatedAt: string
}) {
  return {
    id: row.id,
    name: row.name,
    code: row.code ?? row.id,
    status: row.status,
    plan: '',
    memberCount: 0,
    projectCount: 0,
    quotaUsage: '-',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function dbListTenants(params: {
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
}) {
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 10
  const skip = (page - 1) * pageSize
  const where: Record<string, unknown> = {}
  if (params.status) where.status = params.status
  if (params.keyword?.trim()) {
    where.OR = [
      { name: { contains: params.keyword } },
      { code: { contains: params.keyword } },
    ] as unknown[]
  }
  const [items, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.tenant.count({ where }),
  ])
  return {
    items: items.map(rowToTenant),
    total,
  }
}

export async function dbGetTenantById(id: string) {
  const row = await prisma.tenant.findUnique({ where: { id } })
  return row ? rowToTenant(row) : null
}

export async function dbCreateTenant(payload: {
  name: string
  code?: string
  status?: string
}) {
  const ts = now()
  const row = await prisma.tenant.create({
    data: {
      name: payload.name,
      code: payload.code ?? null,
      status: payload.status ?? 'active',
      createdAt: ts,
      updatedAt: ts,
    },
  })
  return rowToTenant(row)
}

export async function dbUpdateTenant(id: string, payload: Record<string, unknown>) {
  const ts = now()
  const data: Record<string, unknown> = { updatedAt: ts }
  if (payload.name !== undefined) data.name = payload.name as string
  if (payload.code !== undefined) data.code = payload.code as string | null
  if (payload.status !== undefined) data.status = payload.status as string
  const row = await prisma.tenant.update({
    where: { id },
    data: data as Record<string, string | null>,
  })
  return rowToTenant(row)
}

export async function dbDeleteTenant(id: string) {
  await prisma.tenant.delete({ where: { id } })
  return true
}

export async function dbPatchTenantStatus(id: string, status: string) {
  return dbUpdateTenant(id, { status })
}
