/**
 * 流程模板校验器
 * Phase 12：校验转换后的 WorkflowTemplate 与节点
 * Phase B：使用真实 API（agentTemplateService.getTemplateById、planningSkillService.listPlanningSkills）
 */
import type { WorkflowTemplate, WorkflowTemplateNode } from '../schemas/workflowExecution'
import type { WorkflowNodeExecutionType, WorkflowNodeIntentType } from '../schemas/workflowExecution'
import { getTemplateById } from '@/modules/platform/services/agentTemplateService'
import { listPlanningSkills } from '@/modules/platform/services/planningSkillService'

const STATIC_SKILL_IDS = [
  'skill-content-write',
  'skill-image-gen',
  'skill-content-review',
  'skill-review-content',
  'skill-compliance-check',
  'skill-publish',
  'skill-schedule',
  'skill-data-fetch',
  'skill-metrics-write',
  'skill-brand-check',
  'skill-fb-optimize',
]

const ALLOWED_EXECUTION_TYPES: WorkflowNodeExecutionType[] = [
  'agent_task',
  'human_review',
  'approval_gate',
  'result_writer',
  'system_task',
  'manual_input',
  'branch_decision',
]

const ALLOWED_INTENT_TYPES: WorkflowNodeIntentType[] = [
  'create',
  'review',
  'search',
  'research',
  'publish',
  'record',
  'analyze',
  'summarize',
  'classify',
  'reply',
]

export interface TemplateValidationError {
  code: string
  messageZh: string
  path?: string
}

export interface TemplateValidationResult {
  isValid: boolean
  errors: TemplateValidationError[]
  warnings: TemplateValidationError[]
  normalizedSummary: string
}

const ERRORS: Record<string, string> = {
  NODE_MISSING: '节点不存在',
  KEY_DUPLICATE: '节点 key 重复',
  ORDER_INVALID: 'orderIndex 无效',
  DEPENDS_INVALID: '节点依赖引用无效',
  EXECUTION_TYPE_INVALID: 'executionType 不在允许范围内',
  INTENT_TYPE_INVALID: 'intentType 不在允许范围内',
  AGENT_NOT_FOUND: 'recommendedAgentTemplateId 不存在',
  SKILL_NOT_FOUND: 'allowedSkillIds 中存在不存在的 Skill',
  PROJECT_TYPE_INVALID: 'supportedProjectTypeId 不合法',
  GOAL_TYPE_INVALID: 'supportedGoalTypeIds 为空或不合法',
  DELIVERABLE_INVALID: 'supportedDeliverableModes 为空或不合法',
}

export async function validateWorkflowTemplate(
  template: WorkflowTemplate,
  nodes: WorkflowTemplateNode[]
): Promise<TemplateValidationResult> {
  const errors: TemplateValidationError[] = []
  const warnings: TemplateValidationError[] = []
  const nodeIds = new Set(nodes.map((n) => n.id))
  const keys = new Map<string, number>()

  const planningSkills = await listPlanningSkills().catch(() => [])
  const KNOWN_SKILL_IDS = new Set([
    ...planningSkills.map((s) => s.id),
    ...STATIC_SKILL_IDS,
  ])

  if (!nodes || nodes.length === 0) {
    errors.push({ code: 'NODE_MISSING', messageZh: ERRORS.NODE_MISSING })
  }

  if (!template.supportedProjectTypeId?.trim()) {
    errors.push({ code: 'PROJECT_TYPE_INVALID', messageZh: ERRORS.PROJECT_TYPE_INVALID })
  }
  if (!template.supportedGoalTypeIds?.length) {
    errors.push({ code: 'GOAL_TYPE_INVALID', messageZh: ERRORS.GOAL_TYPE_INVALID })
  }
  if (!template.supportedDeliverableModes?.length) {
    errors.push({ code: 'DELIVERABLE_INVALID', messageZh: ERRORS.DELIVERABLE_INVALID })
  }

  for (const node of nodes ?? []) {
    if (node.key) {
      const count = (keys.get(node.key) ?? 0) + 1
      keys.set(node.key, count)
      if (count > 1) {
        errors.push({
          code: 'KEY_DUPLICATE',
          messageZh: `${ERRORS.KEY_DUPLICATE}：${node.key}`,
          path: node.id,
        })
      }
    }

    if (typeof node.orderIndex !== 'number' || node.orderIndex < 1) {
      errors.push({
        code: 'ORDER_INVALID',
        messageZh: `${ERRORS.ORDER_INVALID}：${node.name || node.id}`,
        path: node.id,
      })
    }

    for (const depId of node.dependsOnNodeIds ?? []) {
      if (!nodeIds.has(depId)) {
        errors.push({
          code: 'DEPENDS_INVALID',
          messageZh: `${ERRORS.DEPENDS_INVALID}：${depId}`,
          path: node.id,
        })
      }
    }

    if (!ALLOWED_EXECUTION_TYPES.includes(node.executionType as WorkflowNodeExecutionType)) {
      errors.push({
        code: 'EXECUTION_TYPE_INVALID',
        messageZh: `${ERRORS.EXECUTION_TYPE_INVALID}：${node.executionType}`,
        path: node.id,
      })
    }

    if (!ALLOWED_INTENT_TYPES.includes(node.intentType as WorkflowNodeIntentType)) {
      errors.push({
        code: 'INTENT_TYPE_INVALID',
        messageZh: `${ERRORS.INTENT_TYPE_INVALID}：${node.intentType}`,
        path: node.id,
      })
    }

    if (node.recommendedAgentTemplateId) {
      try {
        const agent = await getTemplateById(node.recommendedAgentTemplateId)
        if (!agent) {
          errors.push({
            code: 'AGENT_NOT_FOUND',
            messageZh: `${ERRORS.AGENT_NOT_FOUND}：${node.recommendedAgentTemplateId}`,
            path: node.id,
          })
        }
      } catch {
        errors.push({
          code: 'AGENT_NOT_FOUND',
          messageZh: `${ERRORS.AGENT_NOT_FOUND}：${node.recommendedAgentTemplateId}`,
          path: node.id,
        })
      }
    }

    for (const skillId of node.allowedSkillIds ?? []) {
      if (!KNOWN_SKILL_IDS.has(skillId)) {
        errors.push({
          code: 'SKILL_NOT_FOUND',
          messageZh: `${ERRORS.SKILL_NOT_FOUND}：${skillId}`,
          path: node.id,
        })
      }
    }
  }

  const isValid = errors.length === 0
  const normalizedSummary = isValid
    ? '模板校验通过'
    : errors.length === 1
      ? errors[0].messageZh
      : `存在 ${errors.length} 个错误`

  return {
    isValid,
    errors,
    warnings,
    normalizedSummary,
  }
}
