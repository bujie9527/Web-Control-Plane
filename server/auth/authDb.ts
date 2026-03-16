/**
 * 认证领域层：用户查询、创建、密码校验
 */
import { prisma } from '../domain/prismaClient'

const now = (): string => new Date().toISOString().slice(0, 19).replace('T', ' ')

export interface UserRecord {
  id: string
  account: string
  passwordHash: string
  name: string
  role: string
  tenantId: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

function rowToUser(row: {
  id: string
  account: string
  passwordHash: string
  name: string
  role: string
  tenantId: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}): UserRecord {
  return {
    id: row.id,
    account: row.account,
    passwordHash: row.passwordHash,
    name: row.name,
    role: row.role,
    tenantId: row.tenantId,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function dbGetUserByAccount(account: string): Promise<UserRecord | null> {
  const row = await prisma.user.findUnique({
    where: { account: account.trim() },
  })
  return row ? rowToUser(row) : null
}

export async function dbCreateUser(payload: {
  account: string
  password: string
  name: string
  role: string
  tenantId?: string | null
}): Promise<UserRecord> {
  // 使用 Node 内置 crypto 做简单 hash（生产建议 bcrypt）
  const crypto = await import('crypto')
  const passwordHash = crypto.createHash('sha256').update(payload.password).digest('hex')
  const ts = now()
  const row = await prisma.user.create({
    data: {
      account: payload.account.trim(),
      passwordHash,
      name: payload.name,
      role: payload.role,
      tenantId: payload.tenantId ?? null,
      isActive: true,
      createdAt: ts,
      updatedAt: ts,
    },
  })
  return rowToUser(row)
}

export async function dbVerifyPassword(
  plainPassword: string,
  hash: string
): Promise<boolean> {
  const crypto = await import('crypto')
  const computed = crypto.createHash('sha256').update(plainPassword).digest('hex')
  return computed === hash
}
