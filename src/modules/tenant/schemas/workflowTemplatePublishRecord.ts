/**
 * 流程模板发布记录
 * Phase 12：与 31-template-publish-governance-rules 一致
 * Phase 12.5：版本治理字段补强
 */

export interface WorkflowTemplatePublishRecord {
  id: string
  planningSessionId: string
  planningDraftId: string
  draftVersion: number
  templateId: string
  scopeType: 'system' | 'tenant'
  tenantId?: string
  publishedBy: string
  publishedAt: string

  /** 版本治理（Phase 12.5） */
  versionGroupId?: string
  templateVersion?: number
  previousVersionTemplateId?: string
  rootTemplateId?: string
  changeSummary?: string
}
