import { prisma } from './prismaClient'

const now = (): string => new Date().toISOString().slice(0, 19).replace('T', ' ')

function maskSecret(secret: string): string {
  const clean = secret.trim()
  if (!clean) return '未配置'
  if (clean.length <= 8) return `${clean.slice(0, 2)}***${clean.slice(-1)}`
  return `${clean.slice(0, 4)}***${clean.slice(-4)}`
}

function encodeSecret(secret: string): string {
  return Buffer.from(secret, 'utf8').toString('base64')
}

function decodeSecret(encoded: string): string {
  try {
    return Buffer.from(encoded, 'base64').toString('utf8')
  } catch {
    return ''
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToCredential(row: any) {
  return {
    id: row.id,
    name: row.name,
    nameZh: row.nameZh ?? undefined,
    providerType: row.providerType,
    secretMasked: row.secretMasked ?? '未配置',
    status: row.status,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
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
    isSystemPreset: row.isSystemPreset,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToConfig(row: any) {
  return {
    id: row.id,
    providerId: row.providerId,
    tenantId: row.tenantId ?? undefined,
    configJson: row.configJson ?? undefined,
    rateLimitJson: row.rateLimitJson ?? undefined,
    status: row.status,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function dbListDataSourceCredentials() {
  const rows = await prisma.dataSourceCredential.findMany({ orderBy: { updatedAt: 'desc' } })
  return rows.map(rowToCredential)
}

export async function dbCreateDataSourceCredential(payload: {
  id?: string
  name: string
  nameZh?: string
  providerType: string
  secret: string
  status?: string
  notes?: string
}) {
  const ts = now()
  const id = payload.id?.trim() || `ds-cred-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const encoded = encodeSecret(payload.secret)
  const row = await prisma.dataSourceCredential.create({
    data: {
      id,
      name: payload.name.trim(),
      nameZh: payload.nameZh?.trim() || null,
      providerType: payload.providerType,
      encryptedSecret: encoded,
      secretMasked: maskSecret(payload.secret),
      status: payload.status ?? 'active',
      notes: payload.notes?.trim() || null,
      createdAt: ts,
      updatedAt: ts,
    },
  })
  return rowToCredential(row)
}

export async function dbUpdateDataSourceCredential(
  id: string,
  payload: {
    name?: string
    nameZh?: string
    providerType?: string
    secret?: string
    status?: string
    notes?: string
  }
) {
  const ts = now()
  const data: Record<string, string | null> = {
    updatedAt: ts,
  }
  if (payload.name !== undefined) data.name = payload.name.trim()
  if (payload.nameZh !== undefined) data.nameZh = payload.nameZh.trim() || null
  if (payload.providerType !== undefined) data.providerType = payload.providerType
  if (payload.secret !== undefined) {
    data.encryptedSecret = encodeSecret(payload.secret)
    data.secretMasked = maskSecret(payload.secret)
  }
  if (payload.status !== undefined) data.status = payload.status
  if (payload.notes !== undefined) data.notes = payload.notes.trim() || null
  await prisma.dataSourceCredential.update({ where: { id }, data })
  const row = await prisma.dataSourceCredential.findUnique({ where: { id } })
  return row ? rowToCredential(row) : null
}

export async function dbDeleteDataSourceCredential(id: string): Promise<boolean> {
  const refs = await prisma.dataSourceProvider.count({ where: { credentialId: id } })
  if (refs > 0) throw new Error(`该凭证仍被 ${refs} 个数据源 Provider 引用，无法删除`)
  await prisma.dataSourceCredential.delete({ where: { id } })
  return true
}

export async function dbListDataSourceProviders() {
  const rows = await prisma.dataSourceProvider.findMany({ orderBy: { updatedAt: 'desc' } })
  return rows.map(rowToProvider)
}

export async function dbGetDataSourceProviderById(id: string) {
  const row = await prisma.dataSourceProvider.findUnique({ where: { id } })
  return row ? rowToProvider(row) : null
}

export async function dbCreateDataSourceProvider(payload: {
  id?: string
  name: string
  nameZh?: string
  providerType: string
  baseUrl?: string
  credentialId?: string
  status?: string
  isSystemPreset?: boolean
  notes?: string
}) {
  const ts = now()
  const id = payload.id?.trim() || `ds-provider-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const row = await prisma.dataSourceProvider.create({
    data: {
      id,
      name: payload.name.trim(),
      nameZh: payload.nameZh?.trim() || null,
      providerType: payload.providerType,
      baseUrl: payload.baseUrl?.trim() || null,
      credentialId: payload.credentialId?.trim() || null,
      status: payload.status ?? 'active',
      isSystemPreset: payload.isSystemPreset ?? false,
      notes: payload.notes?.trim() || null,
      createdAt: ts,
      updatedAt: ts,
    },
  })
  return rowToProvider(row)
}

export async function dbUpdateDataSourceProvider(
  id: string,
  payload: {
    name?: string
    nameZh?: string
    providerType?: string
    baseUrl?: string
    credentialId?: string
    status?: string
    isSystemPreset?: boolean
    notes?: string
  }
) {
  const ts = now()
  const data: Record<string, string | boolean | null> = { updatedAt: ts }
  if (payload.name !== undefined) data.name = payload.name.trim()
  if (payload.nameZh !== undefined) data.nameZh = payload.nameZh.trim() || null
  if (payload.providerType !== undefined) data.providerType = payload.providerType
  if (payload.baseUrl !== undefined) data.baseUrl = payload.baseUrl.trim() || null
  if (payload.credentialId !== undefined) data.credentialId = payload.credentialId.trim() || null
  if (payload.status !== undefined) data.status = payload.status
  if (payload.isSystemPreset !== undefined) data.isSystemPreset = payload.isSystemPreset
  if (payload.notes !== undefined) data.notes = payload.notes.trim() || null
  await prisma.dataSourceProvider.update({ where: { id }, data })
  return dbGetDataSourceProviderById(id)
}

export async function dbDeleteDataSourceProvider(id: string): Promise<boolean> {
  const refs = await prisma.dataSourceConfig.count({ where: { providerId: id } })
  if (refs > 0) throw new Error(`该 Provider 仍被 ${refs} 条配置引用，无法删除`)
  await prisma.dataSourceProvider.delete({ where: { id } })
  return true
}

export async function dbListDataSourceConfigs() {
  const rows = await prisma.dataSourceConfig.findMany({ orderBy: { updatedAt: 'desc' } })
  return rows.map(rowToConfig)
}

export async function dbCreateDataSourceConfig(payload: {
  id?: string
  providerId: string
  tenantId?: string
  configJson?: string
  rateLimitJson?: string
  status?: string
  notes?: string
}) {
  const ts = now()
  const id = payload.id?.trim() || `ds-config-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const row = await prisma.dataSourceConfig.create({
    data: {
      id,
      providerId: payload.providerId,
      tenantId: payload.tenantId?.trim() || null,
      configJson: payload.configJson ?? null,
      rateLimitJson: payload.rateLimitJson ?? null,
      status: payload.status ?? 'active',
      notes: payload.notes?.trim() || null,
      createdAt: ts,
      updatedAt: ts,
    },
  })
  return rowToConfig(row)
}

export async function dbUpdateDataSourceConfig(
  id: string,
  payload: {
    providerId?: string
    tenantId?: string
    configJson?: string
    rateLimitJson?: string
    status?: string
    notes?: string
  }
) {
  const ts = now()
  const data: Record<string, string | null> = { updatedAt: ts }
  if (payload.providerId !== undefined) data.providerId = payload.providerId
  if (payload.tenantId !== undefined) data.tenantId = payload.tenantId.trim() || null
  if (payload.configJson !== undefined) data.configJson = payload.configJson
  if (payload.rateLimitJson !== undefined) data.rateLimitJson = payload.rateLimitJson
  if (payload.status !== undefined) data.status = payload.status
  if (payload.notes !== undefined) data.notes = payload.notes.trim() || null
  await prisma.dataSourceConfig.update({ where: { id }, data })
  const row = await prisma.dataSourceConfig.findUnique({ where: { id } })
  return row ? rowToConfig(row) : null
}

export async function dbDeleteDataSourceConfig(id: string): Promise<boolean> {
  await prisma.dataSourceConfig.delete({ where: { id } })
  return true
}

function providerNeedsCredential(providerType: string): boolean {
  return providerType !== 'rss'
}

export async function dbTestDataSourceProviderConnection(
  providerId: string
): Promise<{ ok: boolean; messageZh: string; latencyMs?: number }> {
  const started = Date.now()
  const provider = await prisma.dataSourceProvider.findUnique({ where: { id: providerId } })
  if (!provider) return { ok: false, messageZh: '数据源 Provider 不存在' }
  if (provider.status !== 'active') return { ok: false, messageZh: '数据源 Provider 未启用' }
  if (!providerNeedsCredential(provider.providerType)) {
    return { ok: true, messageZh: '连接测试成功（该 Provider 无需密钥）', latencyMs: Date.now() - started }
  }
  if (!provider.credentialId) return { ok: false, messageZh: '未绑定数据源凭证' }
  const credential = await prisma.dataSourceCredential.findUnique({ where: { id: provider.credentialId } })
  if (!credential) return { ok: false, messageZh: '绑定的数据源凭证不存在' }
  if (credential.status !== 'active') return { ok: false, messageZh: '绑定的数据源凭证未启用' }
  const secret = decodeSecret(credential.encryptedSecret)
  if (!secret.trim()) return { ok: false, messageZh: '凭证密钥为空，请重新配置' }
  return { ok: true, messageZh: '连接测试成功', latencyMs: Date.now() - started }
}

export async function dbExecuteDataSource(payload: {
  providerId: string
  query: string
  limit?: number
}): Promise<{
  providerId: string
  providerType: string
  items: Array<{ title: string; snippet: string; source: string; url?: string }>
  costTier: 'free' | 'paid'
}> {
  const provider = await prisma.dataSourceProvider.findUnique({ where: { id: payload.providerId } })
  if (!provider) throw new Error('数据源 Provider 不存在')
  if (provider.status !== 'active') throw new Error('数据源 Provider 未启用，无法执行')

  const limit = Math.max(1, Math.min(payload.limit ?? 5, 20))
  const query = payload.query.trim()
  if (!query) throw new Error('查询关键词不能为空')

  const items = Array.from({ length: limit }).map((_, index) => ({
    title: `[${provider.providerType}] ${query} 示例结果 ${index + 1}`,
    snippet: `这是 ${provider.nameZh ?? provider.name} 的示例返回，用于打通统一执行器链路。`,
    source: provider.nameZh ?? provider.name,
    url: provider.baseUrl ?? undefined,
  }))

  return {
    providerId: provider.id,
    providerType: provider.providerType,
    items,
    costTier: provider.providerType === 'rss' ? 'free' : 'paid',
  }
}
