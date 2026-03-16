/**
 * 流程模板发布记录类型定义 — WorkflowPublishRecord
 * 批次 9：对应 Prisma 新增模型
 */

export interface WorkflowPublishRecord {
  id: string
  templateId: string
  planningSessionId?: string | null
  planningDraftId?: string | null
  draftVersion?: number | null
  publishedBy: string
  publishedAt: string
  notes?: string | null
}

export type CreateWorkflowPublishRecordPayload = Omit<WorkflowPublishRecord, 'id' | 'publishedAt'>
