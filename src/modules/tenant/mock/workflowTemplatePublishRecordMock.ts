/**
 * 流程模板发布记录 Mock
 * Phase 12
 */
import type { WorkflowTemplatePublishRecord } from '../schemas/workflowTemplatePublishRecord'

const _records: WorkflowTemplatePublishRecord[] = []

function nextId(): string {
  return `wpr-${Date.now()}`
}

const now = (): string => new Date().toISOString().slice(0, 19).replace('T', ' ')

export function createPublishRecord(
  payload: Omit<WorkflowTemplatePublishRecord, 'id' | 'publishedAt'>
): WorkflowTemplatePublishRecord {
  const record: WorkflowTemplatePublishRecord = {
    id: nextId(),
    publishedAt: now(),
    ...payload,
  }
  _records.push(record)
  return record
}

export function listPublishRecordsBySession(sessionId: string): WorkflowTemplatePublishRecord[] {
  return _records.filter((r) => r.planningSessionId === sessionId)
}

export function getPublishRecordByTemplateId(templateId: string): WorkflowTemplatePublishRecord | null {
  return _records.find((r) => r.templateId === templateId) ?? null
}
