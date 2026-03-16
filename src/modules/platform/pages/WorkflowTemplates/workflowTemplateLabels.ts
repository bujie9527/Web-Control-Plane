/**
 * 流程模板相关字段的前台中文映射
 * 后台字段保持英文，前台展示统一使用中文
 */
import type { WorkflowNodeExecutionType, WorkflowNodeIntentType, WorkflowTemplateStatus } from '@/modules/tenant/schemas/workflowExecution'
import type { AgentTemplateRoleType } from '@/modules/platform/schemas/agentTemplate'

/** 作用域：system / tenant */
export const SCOPE_TYPE_LABELS: Record<string, string> = {
  system: '系统',
  tenant: '租户',
}

/** 流程模板状态 */
export const WORKFLOW_STATUS_LABELS: Record<WorkflowTemplateStatus, string> = {
  draft: '草稿',
  active: '启用',
  deprecated: '已废弃',
  archived: '已归档',
  inactive: '停用',
}

/** 规划模式：manual / ai_assisted / hybrid */
export const PLANNING_MODE_LABELS: Record<string, string> = {
  manual: '人工',
  ai_assisted: 'AI 辅助',
  hybrid: '混合',
}

/** 执行策略：manual / semi_auto / full_auto */
export const EXECUTOR_STRATEGY_LABELS: Record<string, string> = {
  manual: '人工',
  semi_auto: '半自动',
  full_auto: '全自动',
}

/** 节点执行类型 */
export const EXECUTION_TYPE_LABELS: Record<WorkflowNodeExecutionType, string> = {
  agent_task: 'Agent 任务',
  human_review: '人工审核',
  approval_gate: '审批关口',
  result_writer: '结果写入',
  system_task: '系统任务',
  manual_input: '人工输入',
  branch_decision: '分支决策',
}

/** 节点意图类型 */
export const INTENT_TYPE_LABELS: Record<WorkflowNodeIntentType, string> = {
  create: '创建',
  review: '审核',
  search: '搜索',
  research: '研究',
  publish: '发布',
  record: '记录',
  analyze: '分析',
  summarize: '汇总',
  classify: '分类',
  reply: '回复',
}

/** Agent 角色类型 */
export const AGENT_ROLE_LABELS: Record<AgentTemplateRoleType, string> = {
  creator: '创建者',
  reviewer: '审核者',
  publisher: '发布者',
  recorder: '记录者',
  coordinator: '协调者',
  supervisor: '执行监督',
  planner: '规划者',
  other: '其他',
}

/** 字段名中文（用于表单 label、详情 key 展示） */
export const FIELD_LABELS: Record<string, string> = {
  key: '标识',
  name: '名称',
  description: '描述',
  scopeType: '作用域',
  tenantId: '租户 ID',
  status: '状态',
  executionType: '执行类型',
  intentType: '意图类型',
  dependsOnNodeIds: '依赖节点',
  allowedAgentRoleTypes: '允许的 Agent 角色',
  recommendedAgentTemplateId: '推荐 Agent 模板',
  allowedSkillIds: '允许的 Skill',
  inputMapping: '输入映射',
  outputMapping: '输出映射',
  executorStrategy: '执行策略',
  supportedProjectTypeId: '项目类型 ID',
  supportedGoalTypeIds: '目标类型 ID',
  supportedDeliverableModes: '交付模式',
  supportedChannels: '渠道',
  supportedIdentityTypeIds: '身份类型 ID',
  planningMode: '规划模式',
  recommendedAgentTemplateIds: '推荐 Agent 模板',
  recommendedSkillIds: '推荐 Skill',
  defaultReviewPolicy: '默认审核策略',
  nodeCount: '节点数量',
  nodeBaseConfig: '节点基础配置',
}
