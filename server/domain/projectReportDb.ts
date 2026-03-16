import { prisma } from './prismaClient'

const now = (): string => new Date().toISOString().slice(0, 19).replace('T', ' ')

function parseJson(value?: string | null): Record<string, unknown> | undefined {
  if (!value) return undefined
  try {
    return JSON.parse(value) as Record<string, unknown>
  } catch {
    return undefined
  }
}

export async function dbGenerateProjectDashboard(projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) return null

  // 获取属于该项目的终端 ID 列表（Terminal.linkedProjectIds 是 JSON 数组字符串）
  const terminals = await prisma.terminal.findMany({
    where: { tenantId: project.tenantId },
    select: { id: true, linkedProjectIds: true },
  })
  const projectTerminalIds = terminals
    .filter((t) => {
      if (!t.linkedProjectIds) return false
      try {
        const ids = JSON.parse(t.linkedProjectIds) as string[]
        return ids.includes(projectId)
      } catch {
        return false
      }
    })
    .map((t) => t.id)

  const [instanceTotal, instanceCompleted, taskTotal, taskCompleted, incomingCount, outgoingCount] = await Promise.all([
    prisma.workflowInstance.count({ where: { projectId } }),
    prisma.workflowInstance.count({ where: { projectId, status: 'completed' } }),
    prisma.task.count({ where: { projectId } }),
    prisma.task.count({ where: { projectId, status: 'completed' } }),
    projectTerminalIds.length > 0
      ? prisma.incomingMessage.count({ where: { terminalId: { in: projectTerminalIds } } })
      : prisma.incomingMessage.count({ where: { tenantId: project.tenantId } }),
    projectTerminalIds.length > 0
      ? prisma.outgoingMessage.count({ where: { terminalId: { in: projectTerminalIds } } })
      : prisma.outgoingMessage.count({ where: { tenantId: project.tenantId } }),
  ])
  const overview = {
    instanceTotal,
    instanceCompleted,
    taskTotal,
    taskCompleted,
    incomingCount,
    outgoingCount,
    completionRate: instanceTotal > 0 ? Number(((instanceCompleted / instanceTotal) * 100).toFixed(2)) : 0,
  }
  return {
    projectId,
    tenantId: project.tenantId,
    projectName: project.name,
    overview,
  }
}

export async function dbCreateProjectReport(payload: {
  projectId: string
  tenantId: string
  periodType: 'daily' | 'weekly' | 'monthly' | 'custom'
  periodStart: string
  periodEnd: string
  summaryJson?: Record<string, unknown>
  kpiJson?: Record<string, unknown>
  generatedBy?: string
}) {
  const ts = now()
  const row = await prisma.projectReport.create({
    data: {
      projectId: payload.projectId,
      tenantId: payload.tenantId,
      periodType: payload.periodType,
      periodStart: payload.periodStart,
      periodEnd: payload.periodEnd,
      summaryJson: payload.summaryJson ? JSON.stringify(payload.summaryJson) : null,
      kpiJson: payload.kpiJson ? JSON.stringify(payload.kpiJson) : null,
      generatedBy: payload.generatedBy ?? null,
      generatedAt: ts,
      createdAt: ts,
      updatedAt: ts,
    },
  })
  return {
    ...row,
    summaryJson: parseJson(row.summaryJson),
    kpiJson: parseJson(row.kpiJson),
  }
}

export async function dbListProjectReports(projectId: string) {
  const rows = await prisma.projectReport.findMany({
    where: { projectId },
    orderBy: { generatedAt: 'desc' },
  })
  return rows.map((r) => ({
    ...r,
    summaryJson: parseJson(r.summaryJson),
    kpiJson: parseJson(r.kpiJson),
  }))
}

export async function dbListTenantAnalytics(tenantId: string) {
  const [projectCount, reportCount, incomingCount, outgoingCount] = await Promise.all([
    prisma.project.count({ where: { tenantId } }),
    prisma.projectReport.count({ where: { tenantId } }),
    prisma.incomingMessage.count({ where: { tenantId } }),
    prisma.outgoingMessage.count({ where: { tenantId } }),
  ])
  const latestReports = await prisma.projectReport.findMany({
    where: { tenantId },
    orderBy: { generatedAt: 'desc' },
    take: 10,
  })
  return {
    overview: { projectCount, reportCount, incomingCount, outgoingCount },
    latestReports: latestReports.map((r) => ({
      id: r.id,
      projectId: r.projectId,
      periodType: r.periodType,
      generatedAt: r.generatedAt,
    })),
  }
}

