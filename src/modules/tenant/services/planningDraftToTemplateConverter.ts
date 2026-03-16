/**
 * Draft → Template 转换器
 * Phase 12：与 30-planning-draft-to-template-rules 一致
 */
import type { WorkflowTemplate } from '../schemas/workflowExecution'
import type {
  WorkflowPlanningDraft,
  WorkflowPlanningDraftNode,
} from '../schemas/workflowPlanningSession'
import type { WorkflowTemplateNode } from '../schemas/workflowExecution'
import type { WorkflowTemplateScopeType } from '../schemas/workflowExecution'

export interface ConvertedTemplate {
  template: Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt'>
  nodes: Omit<WorkflowTemplateNode, 'id' | 'workflowTemplateId' | 'templateId' | 'createdAt' | 'updatedAt'>[]
}

export interface ConvertOptions {
  templateName: string
  templateCode: string
  templateDescription?: string
  scopeType: WorkflowTemplateScopeType
  tenantId?: string
  sourcePlanningSessionId: string
  sourcePlanningDraftId: string
  sourceDraftVersion: number
  sessionContext: {
    projectTypeId: string
    goalTypeId: string
    deliverableMode: string
  }
  suggestedAgentTemplateIds?: string[]
  suggestedSkillIds?: string[]
}

/**
 * 将 WorkflowPlanningDraft 转换为 WorkflowTemplate 与 WorkflowTemplateNode 结构
 */
export function convertDraftToTemplate(
  draft: WorkflowPlanningDraft,
  options: ConvertOptions
): ConvertedTemplate {
  const { sessionContext, suggestedAgentTemplateIds, suggestedSkillIds } = options

  const template: ConvertedTemplate['template'] = {
    name: options.templateName,
    code: options.templateCode,
    type: 'custom',
    description: options.templateDescription,
    scopeType: options.scopeType,
    tenantId: options.scopeType === 'tenant' ? options.tenantId : undefined,
    status: 'draft',
    version: 1,
    isLatest: true,
    isSystemPreset: false,
    sourcePlanningSessionId: options.sourcePlanningSessionId,
    sourcePlanningDraftId: options.sourcePlanningDraftId,
    sourceDraftVersion: options.sourceDraftVersion,
    supportedProjectTypeId: sessionContext.projectTypeId,
    supportedGoalTypeIds: [sessionContext.goalTypeId],
    supportedDeliverableModes: [sessionContext.deliverableMode],
    planningMode: 'ai_assisted',
    recommendedAgentTemplateIds: suggestedAgentTemplateIds ?? draft.suggestedAgentTemplateIds,
    recommendedSkillIds: suggestedSkillIds ?? draft.suggestedSkillIds,
    nodeCount: draft.nodes?.length ?? 0,
  }

  const sortedNodes = [...(draft.nodes ?? [])].sort((a, b) => a.orderIndex - b.orderIndex)
  const draftIdToNewId = new Map<string, string>()
  const keyCount = new Map<string, number>()

  for (let i = 0; i < sortedNodes.length; i++) {
    const node = sortedNodes[i]
    const baseKey = node.key?.trim() || `node-${i + 1}`
    const count = (keyCount.get(baseKey) ?? 0) + 1
    keyCount.set(baseKey, count)
    const newId = count === 1 ? baseKey : `${baseKey}-${count}`
    draftIdToNewId.set(node.id, newId)
  }

  const nodes: ConvertedTemplate['nodes'] = sortedNodes.map((draftNode, idx) => {
    const newId = draftIdToNewId.get(draftNode.id)!
    const newDependsOn = (draftNode.dependsOnNodeIds ?? [])
      .map((oldId) => draftIdToNewId.get(oldId))
      .filter((id): id is string => id != null)

    return convertDraftNodeToTemplateNode(draftNode, newId, newDependsOn, idx + 1)
  })

  return { template, nodes }
}

function convertDraftNodeToTemplateNode(
  draftNode: WorkflowPlanningDraftNode,
  _newNodeId: string,
  dependsOnNodeIds: string[],
  orderIndex: number
): ConvertedTemplate['nodes'][0] {
  return {
    key: draftNode.key,
    name: draftNode.name,
    description: draftNode.description,
    executionType: draftNode.executionType,
    intentType: draftNode.intentType,
    orderIndex,
    dependsOnNodeIds,
    recommendedAgentTemplateId: draftNode.recommendedAgentTemplateId,
    allowedAgentRoleTypes: draftNode.allowedAgentRoleTypes,
    allowedSkillIds: draftNode.allowedSkillIds,
    inputMapping: draftNode.inputMapping,
    outputMapping: draftNode.outputMapping,
    executorStrategy: draftNode.executorStrategy,
    reviewPolicy: draftNode.reviewPolicy,
    isOptional: false,
    onFailureStrategy: 'manual_retry',
    status: 'enabled',

    nodeKey: draftNode.key,
    nodeName: draftNode.name,
    nodeType: 'agent',
    executorType: 'agent',
    needReview: false,
    agentTemplateId: draftNode.recommendedAgentTemplateId,
    selectedSkillIds: draftNode.allowedSkillIds,
  }
}
