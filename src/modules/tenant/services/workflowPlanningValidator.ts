/**
 * 流程规划校验器
 * Phase 11：Workflow Planner Agent 1.0
 * Phase B：使用真实 API（agentTemplateService.getTemplateById、planningSkillService.listPlanningSkills）
 */
import type { WorkflowPlanningDraft } from '../schemas/workflowPlanningSession'
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

export interface ValidationError {
  code: string
  message: string
  messageZh: string
  path?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  normalizedSummary: string
  /** 是否存在关键占位（bindingStatus === 'missing'），禁止发布为 active */
  hasCriticalPlaceholders?: boolean
  /** 是否存在占位节点（bindingStatus === 'placeholder'），建议先补齐或发布为 draft */
  hasPlaceholders?: boolean
}

const ERRORS: Record<string, string> = {
  NODE_MISSING: '节点不存在',
  KEY_MISSING: '节点缺少 key',
  KEY_DUPLICATE: '节点 key 重复',
  ORDER_INVALID: 'orderIndex 无效',
  DEPENDS_INVALID: '节点依赖引用无效',
  EXECUTION_TYPE_INVALID: 'executionType 不在允许范围内',
  INTENT_TYPE_INVALID: 'intentType 不在允许范围内',
  AGENT_NOT_FOUND: 'recommendedAgentTemplateId 不存在',
  SKILL_NOT_FOUND: 'allowedSkillIds 中存在不存在的 Skill',
  PROJECT_TYPE_OVERRUN: '草案超出项目类型边界',
  GOAL_TYPE_OVERRUN: '草案超出目标类型边界',
  DELIVERABLE_OVERRUN: '草案超出交付模式边界',
  DRAFT_NODE_INCOMPLETE: 'DraftNode 缺少转换为模板所需的基础字段',
}

const WARNINGS: Record<string, string> = {
  DEPENDS_CYCLE: '节点依赖可能存在循环',
  ROLE_TYPES_EMPTY: 'allowedAgentRoleTypes 为空',
  NODE_BINDING_PLACEHOLDER: '节点为占位绑定，建议补齐能力后再发布为启用模板',
  NODE_BINDING_MISSING: '节点能力缺失，不可发布为启用模板',
}

export async function validatePlanningDraft(
  draft: WorkflowPlanningDraft,
  sessionContext?: {
    projectTypeId: string
    goalTypeId: string
    deliverableMode: string
    supportedProjectTypeIds?: string[]
    supportedGoalTypeIds?: string[]
    supportedDeliverableModes?: string[]
    /** 与 Planner Prompt 注入一致的可用 Skill ID 集合；未传则从 API 拉取规划技能 + 静态列表 */
    availableSkillIds?: Set<string>
  }
): Promise<ValidationResult> {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // 先做 nodes 防御，避免后续 draft.nodes 为 undefined 时崩溃
  const nodes = draft.nodes ?? []
  if (!nodes.length) {
    errors.push({
      code: 'NODE_MISSING',
      message: 'No nodes in draft',
      messageZh: ERRORS.NODE_MISSING,
    })
    return { isValid: false, errors, warnings, normalizedSummary: ERRORS.NODE_MISSING }
  }

  const planningSkills = await listPlanningSkills().catch(() => [])
  const defaultSkillIds = new Set([
    ...planningSkills.map((s) => s.id),
    ...STATIC_SKILL_IDS,
  ])
  const skillIdsAllowed = sessionContext?.availableSkillIds ?? defaultSkillIds
  const nodeIds = new Set(nodes.map((n) => n.id))
  const keys = new Map<string, number>()

  for (const node of nodes) {
    if (!node.key) {
      errors.push({
        code: 'KEY_MISSING',
        message: 'Node missing key',
        messageZh: ERRORS.KEY_MISSING,
        path: node.id,
      })
    } else {
      const count = (keys.get(node.key) ?? 0) + 1
      keys.set(node.key, count)
      if (count > 1) {
        errors.push({
          code: 'KEY_DUPLICATE',
          message: `Duplicate key: ${node.key}`,
          messageZh: `${ERRORS.KEY_DUPLICATE}：${node.key}`,
          path: node.id,
        })
      }
    }

    if (typeof node.orderIndex !== 'number' || node.orderIndex < 1) {
      errors.push({
        code: 'ORDER_INVALID',
        message: `Invalid orderIndex for node ${node.id}`,
        messageZh: `${ERRORS.ORDER_INVALID}：节点 ${node.name || node.id}`,
        path: node.id,
      })
    }

    for (const depId of node.dependsOnNodeIds ?? []) {
      if (!nodeIds.has(depId)) {
        errors.push({
          code: 'DEPENDS_INVALID',
          message: `dependsOnNodeIds references unknown node: ${depId}`,
          messageZh: `${ERRORS.DEPENDS_INVALID}：${depId}`,
          path: node.id,
        })
      }
    }

    if (!ALLOWED_EXECUTION_TYPES.includes(node.executionType as WorkflowNodeExecutionType)) {
      errors.push({
        code: 'EXECUTION_TYPE_INVALID',
        message: `Invalid executionType: ${node.executionType}`,
        messageZh: `${ERRORS.EXECUTION_TYPE_INVALID}：${node.executionType}`,
        path: node.id,
      })
    }

    if (!ALLOWED_INTENT_TYPES.includes(node.intentType as WorkflowNodeIntentType)) {
      errors.push({
        code: 'INTENT_TYPE_INVALID',
        message: `Invalid intentType: ${node.intentType}`,
        messageZh: `${ERRORS.INTENT_TYPE_INVALID}：${node.intentType}`,
        path: node.id,
      })
    }

    if (node.recommendedAgentTemplateId) {
      try {
        const agent = await getTemplateById(node.recommendedAgentTemplateId)
        if (!agent) {
          warnings.push({
            code: 'AGENT_NOT_FOUND',
            message: `AgentTemplate not found: ${node.recommendedAgentTemplateId}`,
            messageZh: `${ERRORS.AGENT_NOT_FOUND}：${node.recommendedAgentTemplateId}`,
            path: node.id,
          })
        }
      } catch {
        warnings.push({
          code: 'AGENT_NOT_FOUND',
          message: `AgentTemplate not found: ${node.recommendedAgentTemplateId}`,
          messageZh: `${ERRORS.AGENT_NOT_FOUND}：${node.recommendedAgentTemplateId}`,
          path: node.id,
        })
      }
    }

    for (const skillId of node.allowedSkillIds ?? []) {
      if (!skillIdsAllowed.has(skillId)) {
        warnings.push({
          code: 'SKILL_NOT_FOUND',
          message: `Skill not found: ${skillId}`,
          messageZh: `${ERRORS.SKILL_NOT_FOUND}：${skillId}`,
          path: node.id,
        })
      }
    }

    // DraftNode 可转化性：必须有 id, key, name, executionType, intentType, orderIndex
    if (!node.id || !node.key || !node.name || node.executionType === undefined || node.intentType === undefined) {
      errors.push({
        code: 'DRAFT_NODE_INCOMPLETE',
        message: 'DraftNode missing required fields for template conversion',
        messageZh: `${ERRORS.DRAFT_NODE_INCOMPLETE}：${node.name || node.id}`,
        path: node.id,
      })
    }

    if (!node.allowedAgentRoleTypes?.length && node.executionType === 'agent_task') {
      warnings.push({
        code: 'ROLE_TYPES_EMPTY',
        message: 'allowedAgentRoleTypes is empty for agent_task node',
        messageZh: WARNINGS.ROLE_TYPES_EMPTY,
        path: node.id,
      })
    }
  }

  // 项目边界校验
  if (sessionContext) {
    const { projectTypeId, goalTypeId, deliverableMode } = sessionContext
    if (
      sessionContext.supportedProjectTypeIds?.length &&
      !sessionContext.supportedProjectTypeIds.includes(projectTypeId)
    ) {
      errors.push({
        code: 'PROJECT_TYPE_OVERRUN',
        message: 'Draft exceeds project type boundary',
        messageZh: ERRORS.PROJECT_TYPE_OVERRUN,
      })
    }
    if (
      sessionContext.supportedGoalTypeIds?.length &&
      !sessionContext.supportedGoalTypeIds.includes(goalTypeId)
    ) {
      errors.push({
        code: 'GOAL_TYPE_OVERRUN',
        message: 'Draft exceeds goal type boundary',
        messageZh: ERRORS.GOAL_TYPE_OVERRUN,
      })
    }
    if (
      sessionContext.supportedDeliverableModes?.length &&
      !sessionContext.supportedDeliverableModes.includes(deliverableMode)
    ) {
      errors.push({
        code: 'DELIVERABLE_OVERRUN',
        message: 'Draft exceeds deliverable mode boundary',
        messageZh: ERRORS.DELIVERABLE_OVERRUN,
      })
    }
  }

  // 占位约束：存在 missing 禁止发布为 active，placeholder 仅警告
  let hasCriticalPlaceholders = false
  let hasPlaceholders = false
  for (const node of nodes) {
    const status = (node as { bindingStatus?: string }).bindingStatus
    if (status === 'missing') {
      hasCriticalPlaceholders = true
      errors.push({
        code: 'NODE_BINDING_MISSING',
        message: `Node ${node.name ?? node.key} has missing binding`,
        messageZh: `${WARNINGS.NODE_BINDING_MISSING}：[${node.name ?? node.key}]`,
        path: node.id,
      })
    } else if (status === 'placeholder') {
      hasPlaceholders = true
      warnings.push({
        code: 'NODE_BINDING_PLACEHOLDER',
        message: `Node ${node.name ?? node.key} is placeholder`,
        messageZh: `${WARNINGS.NODE_BINDING_PLACEHOLDER}：[${node.name ?? node.key}]`,
        path: node.id,
      })
    }
  }

  const isValid = errors.length === 0
  const normalizedSummary = isValid
    ? (hasPlaceholders ? '草案校验通过，但存在占位节点，建议先补齐或仅发布为草稿模板' : '草案校验通过')
    : errors.length === 1
      ? errors[0].messageZh
      : `存在 ${errors.length} 个错误，${warnings.length} 个警告`

  return {
    isValid,
    errors,
    warnings,
    normalizedSummary,
    hasCriticalPlaceholders: hasCriticalPlaceholders || undefined,
    hasPlaceholders: hasPlaceholders || undefined,
  }
}
