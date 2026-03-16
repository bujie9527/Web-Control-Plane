import { prisma } from './prismaClient'

const now = (): string => new Date().toISOString().slice(0, 19).replace('T', ' ')

function parseJsonObject(s: string | null): Record<string, unknown> | undefined {
  if (!s) return undefined
  try {
    const parsed = JSON.parse(s) as unknown
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : undefined
  } catch {
    return undefined
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProjectAgentConfig(row: any) {
  return {
    id: row.id,
    projectId: row.projectId,
    agentTemplateId: row.agentTemplateId,
    instructionOverride: row.instructionOverride ?? undefined,
    channelStyleOverride: parseJsonObject(row.channelStyleOverride),
    temperatureOverride: row.temperatureOverride ?? undefined,
    maxTokensOverride: row.maxTokensOverride ?? undefined,
    modelConfigIdOverride: row.modelConfigIdOverride ?? undefined,
    customParams: parseJsonObject(row.customParams),
    isEnabled: row.isEnabled ?? true,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function dbListProjectAgentConfigs(projectId: string) {
  const rows = await prisma.projectAgentConfig.findMany({
    where: { projectId },
    orderBy: { updatedAt: 'desc' },
  })
  return rows.map(rowToProjectAgentConfig)
}

export async function dbGetProjectAgentConfig(projectId: string, agentTemplateId: string) {
  const row = await prisma.projectAgentConfig.findFirst({
    where: { projectId, agentTemplateId },
  })
  return row ? rowToProjectAgentConfig(row) : null
}

export async function dbUpsertProjectAgentConfig(payload: {
  projectId: string
  agentTemplateId: string
  instructionOverride?: string
  channelStyleOverride?: Record<string, unknown>
  temperatureOverride?: number
  maxTokensOverride?: number
  modelConfigIdOverride?: string
  customParams?: Record<string, unknown>
  isEnabled?: boolean
}) {
  const ts = now()
  const data = {
    instructionOverride: payload.instructionOverride ?? null,
    channelStyleOverride: payload.channelStyleOverride
      ? JSON.stringify(payload.channelStyleOverride)
      : null,
    temperatureOverride: payload.temperatureOverride ?? null,
    maxTokensOverride: payload.maxTokensOverride ?? null,
    modelConfigIdOverride: payload.modelConfigIdOverride ?? null,
    customParams: payload.customParams ? JSON.stringify(payload.customParams) : null,
    isEnabled: payload.isEnabled ?? true,
    updatedAt: ts,
  }

  const existing = await prisma.projectAgentConfig.findFirst({
    where: { projectId: payload.projectId, agentTemplateId: payload.agentTemplateId },
    select: { id: true },
  })
  let row
  if (existing) {
    row = await prisma.projectAgentConfig.update({
      where: { id: existing.id },
      data,
    })
  } else {
    row = await prisma.projectAgentConfig.create({
      data: {
        id: `pac-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        projectId: payload.projectId,
        agentTemplateId: payload.agentTemplateId,
        createdAt: ts,
        ...data,
      },
    })
  }
  return rowToProjectAgentConfig(row)
}

export async function dbDeleteProjectAgentConfig(projectId: string, agentTemplateId: string) {
  const existing = await prisma.projectAgentConfig.findFirst({
    where: { projectId, agentTemplateId },
    select: { id: true },
  })
  if (!existing) return false
  await prisma.projectAgentConfig.delete({ where: { id: existing.id } })
  return true
}
