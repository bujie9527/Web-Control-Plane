/**
 * 流程模板发布记录持久化 — WorkflowPublishRecord
 * 批次 9：对应 Prisma 新增模型
 */
import { prisma } from './prismaClient'

const now = (): string => new Date().toISOString().slice(0, 19).replace('T', ' ')

export interface WorkflowPublishRecordRow {
  id: string
  templateId: string
  planningSessionId?: string | null
  planningDraftId?: string | null
  draftVersion?: number | null
  publishedBy: string
  publishedAt: string
  notes?: string | null
}

function rowToRecord(row: {
  id: string
  templateId: string
  planningSessionId: string | null
  planningDraftId: string | null
  draftVersion: number | null
  publishedBy: string
  publishedAt: string
  notes: string | null
}): WorkflowPublishRecordRow {
  return {
    id: row.id,
    templateId: row.templateId,
    planningSessionId: row.planningSessionId ?? undefined,
    planningDraftId: row.planningDraftId ?? undefined,
    draftVersion: row.draftVersion ?? undefined,
    publishedBy: row.publishedBy,
    publishedAt: row.publishedAt,
    notes: row.notes ?? undefined,
  }
}

/** 获取某模板的发布记录列表（按时间降序） */
export async function dbListPublishRecords(templateId: string): Promise<WorkflowPublishRecordRow[]> {
  const rows = await prisma.workflowPublishRecord.findMany({
    where: { templateId },
    orderBy: { publishedAt: 'desc' },
  })
  return rows.map(rowToRecord)
}

/** 创建发布记录 */
export async function dbCreatePublishRecord(payload: {
  templateId: string
  planningSessionId?: string
  planningDraftId?: string
  draftVersion?: number
  publishedBy: string
  notes?: string
}): Promise<WorkflowPublishRecordRow> {
  const ts = now()
  const row = await prisma.workflowPublishRecord.create({
    data: {
      templateId: payload.templateId,
      planningSessionId: payload.planningSessionId ?? null,
      planningDraftId: payload.planningDraftId ?? null,
      draftVersion: payload.draftVersion ?? null,
      publishedBy: payload.publishedBy,
      publishedAt: ts,
      notes: payload.notes ?? null,
    },
  })
  return rowToRecord(row)
}
