/**
 * 流程规划会话相关前台中文映射
 * 与 27-chinese-display-and-label-rules 一致
 */
import type {
  PlanningSessionStatus,
  PlanningSourceType,
  PlannerExecutionBackend,
  PlanningDraftStatus,
  PlanningMessageRole,
  PlanningMessageType,
} from '@/modules/tenant/schemas/workflowPlanningSession'
import {
  EXECUTION_TYPE_LABELS,
  EXECUTOR_STRATEGY_LABELS,
  INTENT_TYPE_LABELS,
} from '@/modules/platform/pages/WorkflowTemplates/workflowTemplateLabels'
import type { AgentTemplateRoleType } from '@/modules/platform/schemas/agentTemplate'
import type { WorkflowNodeExecutionType, WorkflowNodeIntentType } from '@/modules/tenant/schemas/workflowExecution'

/** 规划会话状态 */
export const PLANNING_SESSION_STATUS_LABELS: Record<PlanningSessionStatus, string> = {
  draft: '草稿',
  in_progress: '规划中',
  completed: '已完成',
  archived: '已归档',
  canceled: '已取消',
}

/** 规划来源类型 */
export const PLANNING_SOURCE_TYPE_LABELS: Record<PlanningSourceType, string> = {
  sop_input: 'SOP 输入',
  goal_input: '目标输入',
  manual: '手动创建',
  project_import: '项目导入',
}

/** 规划执行后端 */
export const PLANNER_EXECUTION_BACKEND_LABELS: Record<PlannerExecutionBackend, string> = {
  llm: 'LLM',
  mock: 'Mock 模拟',
  rule_based: '规则引擎',
}

/** 草案状态 */
export const PLANNING_DRAFT_STATUS_LABELS: Record<PlanningDraftStatus, string> = {
  draft: '草稿',
  suggested: '已建议',
  accepted: '已采纳',
  rejected: '已拒绝',
}

/** 消息角色 */
export const PLANNING_MESSAGE_ROLE_LABELS: Record<PlanningMessageRole, string> = {
  user: '用户',
  assistant: '助手',
  system: '系统',
}

/** 消息类型 */
export const PLANNING_MESSAGE_TYPE_LABELS: Record<PlanningMessageType, string> = {
  chat: '对话',
  summary: '修改摘要',
  risk: '风险提示',
  suggestion: '建议',
  system: '系统提示',
}

/** 复用已有映射 */
export { EXECUTION_TYPE_LABELS, EXECUTOR_STRATEGY_LABELS, INTENT_TYPE_LABELS }

/** 节点执行类型（扩展） */
export const DRAFT_EXECUTION_TYPE_LABELS: Record<string, string> = {
  ...EXECUTION_TYPE_LABELS,
} as Record<WorkflowNodeExecutionType, string>

/** 节点意图类型（扩展） */
export const DRAFT_INTENT_TYPE_LABELS: Record<string, string> = {
  ...INTENT_TYPE_LABELS,
} as Record<WorkflowNodeIntentType, string>

/** Agent 角色（若需独立引用） */
export const PLANNING_ROLE_TYPE_LABELS: Record<string, string> = {
  creator: '创建者',
  reviewer: '审核者',
  publisher: '发布者',
  recorder: '记录者',
  coordinator: '协调者',
  planner: '规划者',
  other: '其他',
} as Record<AgentTemplateRoleType, string>

/** 项目类型（规划会话用） */
export const PLANNING_PROJECT_TYPE_LABELS: Record<string, string> = {
  'pt-account-operation': '账号运营',
  'pt-acount-operation': '账号运营', // 兼容旧拼写
  'pt-website-operation': '网站运营',
  'pt-client-acquisition': '客户获取',
}

/** 目标类型（规划会话用） */
export const PLANNING_GOAL_TYPE_LABELS: Record<string, string> = {
  'gt-account-followers': '提升粉丝量',
  'gt-account-engagement': '提升互动量',
  'gt-index-count': '提升收录量',
  'gt-website-traffic': '网站流量提升',
  'gt-lead-generation': '线索获取',
}

/** 交付模式（规划会话用） */
export const PLANNING_DELIVERABLE_LABELS: Record<string, string> = {
  social_content: '社媒内容',
  data_sync: '数据同步',
  seo_article: 'SEO 文章',
}

/** 表单选项：项目类型 */
export const PLANNING_PROJECT_TYPE_OPTIONS = [
  { value: 'pt-account-operation', label: PLANNING_PROJECT_TYPE_LABELS['pt-account-operation'] },
  { value: 'pt-website-operation', label: PLANNING_PROJECT_TYPE_LABELS['pt-website-operation'] },
]

/** 表单选项：目标类型 */
export const PLANNING_GOAL_TYPE_OPTIONS = [
  { value: 'gt-account-followers', label: PLANNING_GOAL_TYPE_LABELS['gt-account-followers'] },
  { value: 'gt-account-engagement', label: PLANNING_GOAL_TYPE_LABELS['gt-account-engagement'] },
  { value: 'gt-index-count', label: PLANNING_GOAL_TYPE_LABELS['gt-index-count'] },
]

/** 表单选项：交付模式 */
export const PLANNING_DELIVERABLE_OPTIONS = [
  { value: 'social_content', label: PLANNING_DELIVERABLE_LABELS['social_content'] },
  { value: 'data_sync', label: PLANNING_DELIVERABLE_LABELS['data_sync'] },
]

/** 规划层级（Phase 15.5） */
export const PLANNER_TIER_LABELS: Record<string, string> = {
  base: '基础版',
  domain: '垂直版',
}

/** 规划垂直领域（Phase 15.5） */
export const PLANNER_DOMAIN_LABELS: Record<string, string> = {
  general: '通用',
  social: '社媒运营',
  website: '建站',
  ai_employee: 'AI 员工',
}

/** Agent 分类（含规划、执行、协调） */
export const AGENT_CATEGORY_LABELS: Record<string, string> = {
  planning: '规划',
  execution: '执行',
  coordination: '协调',
  content: '内容',
  review: '审核',
  publish: '发布',
  analytics: '分析',
}

/** 规划技能中文名 */
export const PLANNING_SKILL_LABELS: Record<string, string> = {
  ParseSOPToStructuredSteps: 'SOP 结构化解析',
  GenerateWorkflowDraft: '生成流程草案',
  ReviseWorkflowDraft: '修订流程草案',
  SummarizeWorkflowChanges: '生成修改摘要',
  SuggestNodeAgentBindings: '推荐节点 Agent 绑定',
}

/** LLM 规划进度文案 */
export const PLANNING_LLM_PROGRESS_LABELS = {
  callingPlanner: '正在调用流程规划助手…',
  generatingDraft: '正在生成流程初稿…',
  revisingDraft: '正在修订流程草案…',
  validatingDraft: '正在校验草案结构…',
  generateSuccess: '草案生成成功',
  reviseSuccess: '草案修订成功',
} as const

/** LLM 规划错误文案 */
export const PLANNING_LLM_ERROR_LABELS = {
  callFailed: '流程规划助手调用失败',
  formatInvalid: '模型返回格式异常',
  schemaInvalid: '草案结构校验失败',
  validatorFailed: '草案未通过规则校验，已保留当前版本',
  retryHint: '请检查输入后重试',
} as const

/** 校验错误码中文 */
export const VALIDATOR_ERROR_LABELS: Record<string, string> = {
  NODE_MISSING: '节点不存在',
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

/** 校验警告码中文 */
export const VALIDATOR_WARNING_LABELS: Record<string, string> = {
  DEPENDS_CYCLE: '节点依赖可能存在循环',
  ROLE_TYPES_EMPTY: 'allowedAgentRoleTypes 为空',
}

/** 发布范围（scopeType） */
export const PUBLISH_SCOPE_TYPE_LABELS: Record<string, string> = {
  system: '平台模板',
  tenant: '租户模板',
}

/** 发布范围选项 */
export const PUBLISH_SCOPE_TYPE_OPTIONS = [
  { value: 'system', label: PUBLISH_SCOPE_TYPE_LABELS['system'] },
  { value: 'tenant', label: PUBLISH_SCOPE_TYPE_LABELS['tenant'] },
]

/** 模板版本信息字段（Phase 12.5） */
export const TEMPLATE_VERSION_FIELD_LABELS: Record<string, string> = {
  version: '当前版本',
  isLatest: '是否最新',
  previousVersion: '上一版本',
  versionGroup: '版本组',
  sourceDraft: '来源草案',
  sourceSession: '来源会话',
  rootTemplate: '根模板',
}
