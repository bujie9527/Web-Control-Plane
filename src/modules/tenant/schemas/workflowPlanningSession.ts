/**
 * 流程规划会话领域对象
 * 与 26-workflow-planning-session-rules 一致
 * Phase 10：Workflow Planning Session 1.0
 */
import type {
  ExecutorStrategy,
  WorkflowNodeExecutionType,
  WorkflowNodeIntentType,
} from './workflowExecution'
import type { AgentTemplateRoleType } from '@/modules/platform/schemas/agentTemplate'

/** 流程规划会话状态 */
export type PlanningSessionStatus = 'draft' | 'in_progress' | 'completed' | 'archived' | 'canceled'

/** 规划来源类型 */
export type PlanningSourceType = 'sop_input' | 'goal_input' | 'manual' | 'project_import'

/** 规划执行后端 */
export type PlannerExecutionBackend = 'llm' | 'mock' | 'rule_based'

/** 规划发起方式 */
export type PlanningEntryMode = 'project' | 'template_clone' | 'blank'

/** 流程规划会话 */
export interface WorkflowPlanningSession {
  id: string
  scopeType: 'system' | 'tenant'
  tenantId?: string
  title: string
  description?: string
  projectTypeId: string
  goalTypeId: string
  deliverableMode: string
  sourceType: PlanningSourceType
  sourceText?: string
  plannerAgentTemplateId?: string
  plannerExecutionBackend: PlannerExecutionBackend
  currentDraftId?: string
  status: PlanningSessionStatus
  createdBy: string
  createdAt: string
  updatedAt: string
  /** 来源项目 ID（基于项目/SOP 发起时） */
  sourceProjectId?: string
  /** 来源模板 ID（基于现有模板派生时） */
  sourceTemplateId?: string
  /** 发起方式 */
  entryMode?: PlanningEntryMode
  /** 创建时能力池快照（Agent/Skill/Terminal 摘要） */
  capabilityPoolSnapshot?: Record<string, unknown>
}

/** 草案状态 */
export type PlanningDraftStatus = 'draft' | 'suggested' | 'accepted' | 'rejected'

/** 流程规划草案 */
export interface WorkflowPlanningDraft {
  id: string
  sessionId: string
  version: number
  summary?: string
  parsedSOP?: string
  nodes: WorkflowPlanningDraftNode[]
  suggestedAgentTemplateIds?: string[]
  suggestedSkillIds?: string[]
  changeSummary?: string
  riskNotes?: string
  /**
   * Planner 分析后，系统当前能力无法覆盖的需求列表
   * 每条格式：「[节点名]需要[能力描述]，但当前无支持的 Agent/Skill」
   * 由 workflowPlannerLLMAdapter 在解析 LLM 输出时写入
   */
  missingCapabilities?: string[]
  /**
   * Planner 对整体 Agent/Skills 覆盖情况的补充说明
   * 可包含"当前节点 X 推荐使用 Agent Y 的原因"等信息
   */
  capabilityNotes?: string
  status: PlanningDraftStatus
  createdAt: string
  /** 图结构版本（用于变更检测） */
  graphVersion?: number
  /** 最近一次变更集（可选） */
  changeSet?: Record<string, unknown>
  /** 最近一次校验结果快照 */
  validationSnapshot?: Record<string, unknown>
  /** 画布视口/布局（缩放、平移等） */
  canvasLayout?: { viewport?: { x: number; y: number; zoom: number } }
}

/** 节点绑定状态（占位式建模） */
export type NodeBindingStatus = 'ready' | 'placeholder' | 'missing'

/** 占位规格（能力暂缺时的描述） */
export interface PlaceholderSpec {
  name?: string
  description?: string
  /** 后续补齐责任说明 */
  assigneeNote?: string
}

/** 草案节点（兼容 WorkflowTemplateNode 结构） */
export interface WorkflowPlanningDraftNode {
  id: string
  key: string
  name: string
  description?: string
  executionType: WorkflowNodeExecutionType
  intentType: WorkflowNodeIntentType
  orderIndex: number
  dependsOnNodeIds: string[]
  recommendedAgentTemplateId?: string
  allowedAgentRoleTypes?: AgentTemplateRoleType[]
  allowedSkillIds?: string[]
  inputMapping?: Record<string, unknown>
  outputMapping?: Record<string, unknown>
  executorStrategy?: ExecutorStrategy
  reviewPolicy?: Record<string, unknown>
  /** 允许的终端类型（用于发布/执行约束） */
  allowedTerminalTypes?: string[]
  /** 绑定状态：已就绪 / 占位 / 缺失 */
  bindingStatus?: NodeBindingStatus
  /** 需要的 Agent 角色/能力描述（占位时填写） */
  agentRequirement?: string
  /** 需要的终端类型/平台描述（占位时填写） */
  terminalRequirement?: string
  /** 需要的资源约束（身份、数据源等） */
  resourceRequirement?: string
  /** 占位规格（bindingStatus 为 placeholder 时） */
  placeholderSpec?: PlaceholderSpec
  /** 画布上的位置（x, y） */
  position?: { x: number; y: number }
}

/** 消息角色 */
export type PlanningMessageRole = 'user' | 'assistant' | 'system'

/** 消息类型 */
export type PlanningMessageType = 'chat' | 'summary' | 'risk' | 'suggestion' | 'system'

/** 规划会话列表查询参数（repository / API 共用） */
export interface PlanningSessionListParams {
  page?: number
  pageSize?: number
  scopeType?: 'system' | 'tenant'
  tenantId?: string
  status?: PlanningSessionStatus
  projectTypeId?: string
  deliverableMode?: string
  sourceType?: PlanningSourceType
}

/** 流程规划消息 */
export interface WorkflowPlanningMessage {
  id: string
  sessionId: string
  role: PlanningMessageRole
  content: string
  relatedDraftVersion?: number
  messageType: PlanningMessageType
  createdAt: string
}
