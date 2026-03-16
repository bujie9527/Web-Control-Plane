/**
 * 流程模板发布服务（Phase 18 — 发布写入真实 API）
 *
 * 迁移说明：
 *   Before: createWorkflowTemplate / addNodesFromDraftConversion / createPublishRecord 均调用 mock
 *   After:  调用真实 templateRepository / templateNodeRepository / workflowPublishRecordRepository → API → Prisma
 *
 * 发布流程（不变）：
 *   1. Draft Validator  2. Convert Draft → Template  3. Template Validator
 *   4. POST /api/workflow-templates（创建模板）
 *   5. POST /api/workflow-template-nodes（批量创建节点）
 *   6. POST /api/workflow-templates/:id/publish-records（记录发布）
 */
import type { WorkflowTemplate, WorkflowTemplateScopeType } from '../schemas/workflowExecution'
import type { WorkflowPublishRecord } from '../schemas/workflowPublishRecord'
import { getPlanningDraftById, getPlanningSessionById } from './workflowPlanningSessionService'
import { validatePlanningDraft } from './workflowPlanningValidator'
import { convertDraftToTemplate } from './planningDraftToTemplateConverter'
import { validateWorkflowTemplate } from './workflowTemplateValidator'
import * as templateRepo from '../repositories/workflowTemplateRepository'
import * as templateNodeRepo from '../repositories/workflowTemplateNodeRepository'
import * as publishRecordRepo from '../repositories/workflowPublishRecordRepository'

export interface PublishDraftAsTemplateParams {
  draftId: string
  scopeType: WorkflowTemplateScopeType
  tenantId?: string
  templateName: string
  templateDescription?: string
  publishedBy: string
}

export interface PublishDraftAsTemplateResult {
  template: WorkflowTemplate
  publishRecord: WorkflowPublishRecord
}

/**
 * 发布草案为流程模板（接入真实 API）
 */
export async function publishDraftAsTemplate(
  params: PublishDraftAsTemplateParams
): Promise<PublishDraftAsTemplateResult> {
  const { draftId, scopeType, tenantId, templateName, templateDescription, publishedBy } = params

  const draft = await getPlanningDraftById(draftId)
  if (!draft) throw new Error('草案不存在')
  const session = await getPlanningSessionById(draft.sessionId)
  if (!session) throw new Error('规划会话不存在')
  if (scopeType === 'tenant' && !tenantId) throw new Error('租户模板必须指定 tenantId')

  const draftValidation = await validatePlanningDraft(draft, {
    projectTypeId: session.projectTypeId,
    goalTypeId: session.goalTypeId,
    deliverableMode: session.deliverableMode,
  })
  if (!draftValidation.isValid) {
    throw new Error(`草案校验失败：${draftValidation.errors.map((e) => e.messageZh).join('；')}`)
  }

  const templateCode = `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const converted = convertDraftToTemplate(draft, {
    templateName,
    templateCode,
    templateDescription: templateDescription,
    scopeType,
    tenantId,
    sourcePlanningSessionId: session.id,
    sourcePlanningDraftId: draft.id,
    sourceDraftVersion: draft.version,
    sessionContext: {
      projectTypeId: session.projectTypeId,
      goalTypeId: session.goalTypeId,
      deliverableMode: session.deliverableMode,
    },
  })
  const nodesWithId = converted.nodes.map((n, i) => ({
    ...n,
    id: n.key || `n${i}`,
    workflowTemplateId: '',
    templateId: '',
    createdAt: '',
    updatedAt: '',
  })) as import('../schemas/workflowExecution').WorkflowTemplateNode[]
  const templateForValidation: WorkflowTemplate = {
    ...converted.template,
    id: '',
    createdAt: '',
    updatedAt: '',
  }
  const templateValidation = await validateWorkflowTemplate(templateForValidation, nodesWithId)
  if (!templateValidation.isValid) {
    throw new Error(`模板校验失败：${templateValidation.errors.map((e) => e.messageZh).join('；')}`)
  }

  const templateRes = await templateRepo.fetchCreateWorkflowTemplate({
    name: converted.template.name,
    code: converted.template.code,
    scopeType: converted.template.scopeType,
    tenantId: converted.template.tenantId,
    description: converted.template.description,
    status: 'draft',
    supportedProjectTypeId: converted.template.supportedProjectTypeId ?? session.projectTypeId,
    supportedGoalTypeIds: converted.template.supportedGoalTypeIds ?? [session.goalTypeId],
    supportedDeliverableModes: converted.template.supportedDeliverableModes ?? [session.deliverableMode],
  })
  if (templateRes.code !== 0 || !templateRes.data) {
    throw new Error(templateRes.message || '创建流程模板失败')
  }
  const template = templateRes.data

  for (const node of converted.nodes) {
    await templateNodeRepo.fetchCreateTemplateNode(template.id, {
      key: node.key,
      name: node.name,
      description: node.description,
      executionType: node.executionType,
      intentType: node.intentType,
      orderIndex: node.orderIndex,
      dependsOnNodeIds: node.dependsOnNodeIds,
      recommendedAgentTemplateId: node.recommendedAgentTemplateId,
      allowedSkillIds: node.allowedSkillIds,
    })
  }

  const recordRes = await publishRecordRepo.createPublishRecord(template.id, {
    planningSessionId: session.id,
    planningDraftId: draft.id,
    draftVersion: draft.version,
    publishedBy,
  })
  if (recordRes.code !== 0 || !recordRes.data) {
    throw new Error(recordRes.message || '创建发布记录失败')
  }

  return {
    template,
    publishRecord: recordRes.data,
  }
}
