/**
 * 项目子域持久化 — ProjectIdentityBinding / ProjectDeliverable / ProjectResourceConfig
 * 批次 9：对应 Prisma 新增模型
 */
import { prisma } from './prismaClient'

const now = (): string => new Date().toISOString().slice(0, 19).replace('T', ' ')

// ─── ProjectIdentityBinding ──────────────────────────────────────────────────

export interface ProjectIdentityBindingRow {
  id: string
  projectId: string
  identityId: string
  isDefault: boolean
  createdAt: string
}

function rowToBinding(row: { id: string; projectId: string; identityId: string; isDefault: boolean; createdAt: string }): ProjectIdentityBindingRow {
  return { id: row.id, projectId: row.projectId, identityId: row.identityId, isDefault: row.isDefault, createdAt: row.createdAt }
}

/** 获取项目的所有身份绑定 */
export async function dbListProjectIdentityBindings(
  projectId: string
): Promise<ProjectIdentityBindingRow[]> {
  const rows = await prisma.projectIdentityBinding.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
  })
  return rows.map(rowToBinding)
}

/** 新增项目身份绑定 */
export async function dbAddProjectIdentityBinding(payload: {
  projectId: string
  identityId: string
  isDefault?: boolean
}): Promise<ProjectIdentityBindingRow> {
  const ts = now()
  if (payload.isDefault === true) {
    await prisma.projectIdentityBinding.updateMany({
      where: { projectId: payload.projectId },
      data: { isDefault: false },
    })
  }
  const row = await prisma.projectIdentityBinding.create({
    data: {
      projectId: payload.projectId,
      identityId: payload.identityId,
      isDefault: payload.isDefault ?? false,
      createdAt: ts,
    },
  })
  return rowToBinding(row)
}

/** 删除项目身份绑定 */
export async function dbRemoveProjectIdentityBinding(
  projectId: string,
  identityId: string
): Promise<void> {
  await prisma.projectIdentityBinding.deleteMany({
    where: { projectId, identityId },
  })
}

/** 设置某条绑定为默认（同时清除其他默认） */
export async function dbSetDefaultProjectIdentityBinding(
  projectId: string,
  identityId: string
): Promise<void> {
  await prisma.$transaction([
    prisma.projectIdentityBinding.updateMany({
      where: { projectId },
      data: { isDefault: false },
    }),
    prisma.projectIdentityBinding.updateMany({
      where: { projectId, identityId },
      data: { isDefault: true },
    }),
  ])
}

// ─── ProjectDeliverable ──────────────────────────────────────────────────────

export interface ProjectDeliverableRow {
  id: string
  projectId: string
  deliverableType: string
  description: string
  frequency?: string | null
  target?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

function rowToDeliverable(row: {
  id: string
  projectId: string
  deliverableType: string
  description: string
  frequency: string | null
  target: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}): ProjectDeliverableRow {
  return {
    id: row.id,
    projectId: row.projectId,
    deliverableType: row.deliverableType,
    description: row.description,
    frequency: row.frequency ?? undefined,
    target: row.target ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

/** 获取项目所有交付标的 */
export async function dbListProjectDeliverables(
  projectId: string
): Promise<ProjectDeliverableRow[]> {
  const rows = await prisma.projectDeliverable.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
  })
  return rows.map(rowToDeliverable)
}

/** 新增交付标的 */
export async function dbCreateProjectDeliverable(payload: {
  projectId: string
  deliverableType: string
  description: string
  frequency?: string
  target?: string
  notes?: string
}): Promise<ProjectDeliverableRow> {
  const ts = now()
  const row = await prisma.projectDeliverable.create({
    data: {
      projectId: payload.projectId,
      deliverableType: payload.deliverableType,
      description: payload.description,
      frequency: payload.frequency ?? null,
      target: payload.target ?? null,
      notes: payload.notes ?? null,
      createdAt: ts,
      updatedAt: ts,
    },
  })
  return rowToDeliverable(row)
}

/** 更新交付标的 */
export async function dbUpdateProjectDeliverable(
  id: string,
  payload: Partial<Omit<ProjectDeliverableRow, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>
): Promise<ProjectDeliverableRow> {
  const ts = now()
  const data: Record<string, unknown> = { updatedAt: ts }
  if (payload.deliverableType !== undefined) data.deliverableType = payload.deliverableType
  if (payload.description !== undefined) data.description = payload.description
  if (payload.frequency !== undefined) data.frequency = payload.frequency
  if (payload.target !== undefined) data.target = payload.target
  if (payload.notes !== undefined) data.notes = payload.notes
  const row = await prisma.projectDeliverable.update({
    where: { id },
    data: data as Record<string, string | null>,
  })
  return rowToDeliverable(row)
}

/** 删除交付标的 */
export async function dbDeleteProjectDeliverable(id: string): Promise<void> {
  await prisma.projectDeliverable.delete({ where: { id } })
}

/** 批量替换项目交付标的（创建向导用：先删除再插入） */
export async function dbReplaceProjectDeliverables(
  projectId: string,
  items: Omit<ProjectDeliverableRow, 'id' | 'createdAt' | 'updatedAt'>[]
): Promise<ProjectDeliverableRow[]> {
  const ts = now()
  await prisma.projectDeliverable.deleteMany({ where: { projectId } })
  if (items.length === 0) return []
  const created = await prisma.projectDeliverable.createManyAndReturn({
    data: items.map((item) => ({
      projectId: item.projectId,
      deliverableType: item.deliverableType,
      description: item.description,
      frequency: item.frequency ?? null,
      target: item.target ?? null,
      notes: item.notes ?? null,
      createdAt: ts,
      updatedAt: ts,
    })),
  })
  return created.map(rowToDeliverable)
}

// ─── ProjectResourceConfig ───────────────────────────────────────────────────

export interface ProjectResourceConfigRow {
  id: string
  projectId: string
  configType: string
  label: string
  value: string
  notes?: string | null
  createdAt: string
  updatedAt: string
}

function rowToResourceConfig(row: {
  id: string
  projectId: string
  configType: string
  label: string
  value: string
  notes: string | null
  createdAt: string
  updatedAt: string
}): ProjectResourceConfigRow {
  return {
    id: row.id,
    projectId: row.projectId,
    configType: row.configType,
    label: row.label,
    value: row.value,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

/** 获取项目所有资源配置 */
export async function dbListProjectResourceConfigs(
  projectId: string
): Promise<ProjectResourceConfigRow[]> {
  const rows = await prisma.projectResourceConfig.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
  })
  return rows.map(rowToResourceConfig)
}

/** 新增资源配置项 */
export async function dbCreateProjectResourceConfig(payload: {
  projectId: string
  configType: string
  label: string
  value: string
  notes?: string
}): Promise<ProjectResourceConfigRow> {
  const ts = now()
  const row = await prisma.projectResourceConfig.create({
    data: {
      projectId: payload.projectId,
      configType: payload.configType,
      label: payload.label,
      value: payload.value,
      notes: payload.notes ?? null,
      createdAt: ts,
      updatedAt: ts,
    },
  })
  return rowToResourceConfig(row)
}

/** 更新资源配置项 */
export async function dbUpdateProjectResourceConfig(
  id: string,
  payload: Partial<Omit<ProjectResourceConfigRow, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>
): Promise<ProjectResourceConfigRow> {
  const ts = now()
  const data: Record<string, unknown> = { updatedAt: ts }
  if (payload.configType !== undefined) data.configType = payload.configType
  if (payload.label !== undefined) data.label = payload.label
  if (payload.value !== undefined) data.value = payload.value
  if (payload.notes !== undefined) data.notes = payload.notes
  const row = await prisma.projectResourceConfig.update({
    where: { id },
    data: data as Record<string, string | null>,
  })
  return rowToResourceConfig(row)
}

/** 删除资源配置项 */
export async function dbDeleteProjectResourceConfig(id: string): Promise<void> {
  await prisma.projectResourceConfig.delete({ where: { id } })
}

/** 批量替换项目资源配置（创建向导用） */
export async function dbReplaceProjectResourceConfigs(
  projectId: string,
  items: Omit<ProjectResourceConfigRow, 'id' | 'createdAt' | 'updatedAt'>[]
): Promise<ProjectResourceConfigRow[]> {
  const ts = now()
  await prisma.projectResourceConfig.deleteMany({ where: { projectId } })
  if (items.length === 0) return []
  const created = await prisma.projectResourceConfig.createManyAndReturn({
    data: items.map((item) => ({
      projectId: item.projectId,
      configType: item.configType,
      label: item.label,
      value: item.value,
      notes: item.notes ?? null,
      createdAt: ts,
      updatedAt: ts,
    })),
  })
  return created.map(rowToResourceConfig)
}
