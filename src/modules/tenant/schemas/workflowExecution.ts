/**
 * Workflow & Task Execution 领域对象
 * 与 docs/architecture/12-workflow-task-execution-model 一致
 * Phase A：线性流程，无分支、无拖拽、无真实执行
 */

/** 流程模板状态 */
export type WorkflowTemplateStatus =
  | 'draft'
  | 'active'
  | 'deprecated'
  | 'archived'
  /** 兼容旧数据 */
  | 'inactive'

/** 流程实例状态 */
export type WorkflowInstanceStatus =
  | 'draft'
  | 'pending'
  | 'running'
  | 'waiting_review'
  | 'success'
  | 'failed'
  | 'canceled'

/** 流程实例节点状态（rule-36：使用 completed 表示成功） */
export type WorkflowInstanceNodeStatus =
  | 'pending'
  | 'running'
  | 'waiting_review'
  | 'completed'
  | 'failed'
  | 'skipped'

/** 节点类型（占位，可后续扩展） */
export type WorkflowNodeType = 'manual' | 'agent' | 'review' | 'system' | 'other'

/** 执行者类型 */
export type WorkflowExecutorType = 'human' | 'agent' | 'system' | 'api'

/** 执行策略（与 Agent 模板一致） */
export type ExecutorStrategy = 'manual' | 'semi_auto' | 'full_auto'

/** 流程模板作用域 */
export type WorkflowTemplateScopeType = 'system' | 'tenant'

/** 流程模板规划模式 */
export type WorkflowPlanningMode = 'manual' | 'ai_assisted' | 'hybrid'

/** 节点执行类型 */
export type WorkflowNodeExecutionType =
  | 'agent_task'
  | 'human_review'
  | 'approval_gate'
  | 'result_writer'
  | 'system_task'
  | 'manual_input'
  | 'branch_decision'

/** 节点意图类型 */
export type WorkflowNodeIntentType =
  | 'create'
  | 'review'
  | 'search'
  | 'research'
  | 'publish'
  | 'record'
  | 'analyze'
  | 'summarize'
  | 'classify'
  | 'reply'

/** 重试策略（Phase 16） */
export type RetryStrategy = 'same_agent' | 'fallback_agent' | 'fallback_skill'

/** 节点重试策略（Phase 16） */
export interface RetryPolicy {
  enabled: boolean
  maxRetryCount: number
  retryStrategy: RetryStrategy
  autoRetryEnabled: boolean
}

/** 执行监督策略（Phase 16） */
export interface SupervisorPolicy {
  allowSkip: boolean
  allowRestartPreviousNode: boolean
  allowManualReview: boolean
  allowAbortWorkflow: boolean
  allowAutoRecovery: boolean
}

/** 节点恢复状态（Phase 16） */
export type RecoveryStatus =
  | 'none'
  | 'retrying'
  | 'fallback_agent'
  | 'fallback_skill'
  | 'manual_review'
  | 'paused'

/** 节点绑定状态（占位式建模，与规划会话一致） */
export type NodeBindingStatus = 'ready' | 'placeholder' | 'missing'

/** 占位规格（能力暂缺时的描述） */
export interface PlaceholderSpec {
  name?: string
  description?: string
  assigneeNote?: string
}

/** 节点级审核策略覆盖（租户可改） */
export interface ReviewPolicyOverride {
  requireHumanReview?: boolean
  requireNodeReview?: boolean
  autoApproveWhenConfidenceGte?: number
}

/** 模板快照（绑定时保存，只读） */
export interface AgentTemplateSnapshot {
  id: string
  name: string
  code: string
  roleType: string
  defaultModelKey?: string
  supportedSkillIds?: string[]
  requireHumanReview: boolean
  requireNodeReview: boolean
  autoApproveWhenConfidenceGte?: number
  manual: boolean
  semi_auto: boolean
  full_auto: boolean
}

/** 流程实例来源类型 */
export type WorkflowInstanceSourceType = 'template' | 'sop_suggestion' | 'manual'

/** 租户下实例列表项：实例 + 展示用 projectName、identityName、templateName */
export interface WorkflowInstanceListItem extends WorkflowInstance {
  projectName?: string
  identityName?: string
  templateName?: string
}

/** 标准流程模板 */
export interface WorkflowTemplate {
  /** 基础身份 */
  id: string
  name: string
  code: string
  type: string
  description?: string

  /** 作用域与所有权 */
  scopeType: WorkflowTemplateScopeType
  tenantId?: string

  /** 生命周期 */
  status: WorkflowTemplateStatus
  version: number
  isLatest: boolean
  isSystemPreset: boolean

  /** 来源关系 */
  sourceTemplateId?: string
  sourceVersion?: number
  clonedFromTemplateId?: string

  /** 规划草案来源（Phase 12） */
  sourcePlanningSessionId?: string
  sourcePlanningDraftId?: string
  sourceDraftVersion?: number

  /** 版本治理（Phase 12.5） */
  versionGroupId?: string
  previousVersionTemplateId?: string
  rootTemplateId?: string

  /** 项目语义边界 */
  supportedProjectTypeId: string
  supportedGoalTypeIds: string[]
  supportedDeliverableModes: string[]
  supportedChannels?: string[]
  supportedIdentityTypeIds?: string[]

  /** 规划模式 */
  planningMode: WorkflowPlanningMode

  /** 推荐能力 */
  recommendedAgentTemplateIds?: string[]
  recommendedSkillIds?: string[]
  defaultReviewPolicy?: Record<string, unknown>

  /** 统计 */
  nodeCount: number
  createdAt: string
  updatedAt: string

  /**
   * 兼容旧版页面字段（逐步下线）
   * @deprecated use supportedGoalTypeIds
   */
  applicableGoalTypes?: string[]
  /**
   * @deprecated use supportedDeliverableModes
   */
  applicableDeliverableTypes?: string[]
}

/** 模板节点 */
export interface WorkflowTemplateNode {
  /** 新版结构化字段 */
  workflowTemplateId: string
  key: string
  name: string
  executionType: WorkflowNodeExecutionType
  intentType: WorkflowNodeIntentType
  dependsOnNodeIds: string[]
  recommendedAgentTemplateId?: string
  allowedAgentRoleTypes?: string[]
  allowedSkillIds?: string[]
  inputMapping?: Record<string, unknown>
  outputMapping?: Record<string, unknown>
  reviewPolicy?: Record<string, unknown>
  isOptional: boolean
  onFailureStrategy: 'stop' | 'continue' | 'manual_retry'
  status: 'enabled' | 'disabled'

  /** 恢复策略（Phase 16） */
  retryPolicy?: RetryPolicy
  fallbackAgentTemplateIds?: string[]
  fallbackSkillIds?: string[]
  supervisorPolicy?: SupervisorPolicy

  /** 允许的终端类型 */
  allowedTerminalTypes?: string[]
  /** 绑定状态：已就绪 / 占位 / 缺失 */
  bindingStatus?: NodeBindingStatus
  /** 占位规格（bindingStatus 为 placeholder 时） */
  placeholderSpec?: PlaceholderSpec
  /** 画布上的位置（x, y） */
  position?: { x: number; y: number }

  /** 兼容旧版执行模型字段 */
  id: string
  templateId: string
  nodeKey: string
  nodeName: string
  nodeType: WorkflowNodeType
  role?: string
  executorType: WorkflowExecutorType
  needReview: boolean
  orderIndex: number
  nextNodeKey?: string
  description?: string
  /** Agent 模板绑定（仅 nodeType=agent 时有意义） */
  agentTemplateId?: string
  selectedSkillIds?: string[]
  executorStrategy?: ExecutorStrategy
  reviewPolicyOverride?: ReviewPolicyOverride
  templateSnapshot?: AgentTemplateSnapshot
  createdAt: string
  updatedAt: string
}

/** 流程实例 */
export interface WorkflowInstance {
  id: string
  projectId: string
  templateId?: string
  /** 模板 ID（Phase 13，与 templateId 等价） */
  workflowTemplateId?: string
  goalId?: string
  deliverableId?: string
  sopId?: string
  /** 实例执行身份，属于实例上下文 */
  identityId?: string
  status: WorkflowInstanceStatus
  currentNodeKey?: string
  /** 当前节点 ID（Phase 13，实例节点 id） */
  currentNodeId?: string
  /** 阻塞原因 */
  blockedReason?: string
  /** 是否等待审核 */
  waitingForReview?: boolean
  /** 执行摘要 */
  executionSummary?: string
  /** 交付快照（创建时保存） */
  deliverableSnapshot?: Record<string, unknown>
  sourceType?: WorkflowInstanceSourceType
  sourceSummary?: string
  createdAt: string
  updatedAt: string
}

/** 创建流程实例请求（项目详情页发起流程与任务） */
export interface CreateWorkflowInstancePayload {
  projectId: string
  templateId: string
  identityId: string
  taskName: string
  taskDescription?: string
  sourceType?: WorkflowInstanceSourceType
}

/** 实例节点 */
export interface WorkflowInstanceNode {
  id: string
  workflowInstanceId: string
  templateNodeId?: string
  nodeKey: string
  nodeName: string
  /** 名称（Phase 13，与 nodeName 等价） */
  name?: string
  nodeType: WorkflowNodeType
  executorType: WorkflowExecutorType
  executorId?: string
  terminalId?: string
  /** 执行类型（Phase 13） */
  executionType?: WorkflowNodeExecutionType
  /** 意图类型（Phase 13） */
  intentType?: WorkflowNodeIntentType
  status: WorkflowInstanceNodeStatus
  reviewStatus?: string
  /** 选中的 Agent 模板 ID */
  selectedAgentTemplateId?: string
  /** 选中的 Skill ID 列表 */
  selectedSkillIds?: string[]
  startedAt?: string
  finishedAt?: string
  /** 完成时间（Phase 13，与 finishedAt 等价） */
  completedAt?: string
  resultSummary?: string
  /** 执行摘要（与 resultSummary 等价，兼容展示） */
  executionSummary?: string
  /** 错误摘要 */
  errorSummary?: string
  /** 审核摘要 */
  reviewSummary?: string

  /** Worker LLM 执行信息（Phase 17） */
  workerOutputJson?: Record<string, unknown>
  workerExecutionModel?: string
  workerExecutionDurationMs?: number
  workerExecutionAgentId?: string

  /** 恢复信息（Phase 16） */
  retryCount?: number
  lastErrorCode?: string
  lastErrorSummary?: string
  recoveryStatus?: RecoveryStatus
  lastRecoveryAction?: string

  createdAt: string
  updatedAt: string
}

/** 运行日志事件类型（Phase 13/16） */
export type WorkflowRuntimeLogEventType =
  | 'workflow_started'
  | 'node_started'
  | 'node_completed'
  | 'node_failed'
  | 'waiting_review'
  | 'manual_continue'
  | 'workflow_completed'
  | 'workflow_paused'
  | 'workflow_aborted'
  | 'node_retry'
  | 'node_retry_started'
  | 'node_retry_completed'
  | 'fallback_agent_used'
  | 'fallback_skill_used'
  | 'recovery_manual_review'
  | 'recovery_paused'
  | 'recovery_aborted'
  | 'restart_previous_node'
  | 'worker_llm_execution_started'
  | 'worker_llm_execution_completed'
  | 'worker_llm_execution_failed'

/** 流程运行日志（Phase 13） */
export interface WorkflowRuntimeLog {
  id: string
  workflowInstanceId: string
  workflowInstanceNodeId?: string
  eventType: WorkflowRuntimeLogEventType
  message: string
  createdAt: string
}

/** 监督决策类型（Phase 14/16） */
export type WorkflowSupervisorDecisionType =
  | 'retry'
  | 'skip'
  | 'manual_review'
  | 'pause_workflow'
  | 'continue_workflow'
  | 'abort_workflow'
  | 'no_action'
  | 'replace_agent'
  | 'replace_skill'
  | 'restart_previous_node'

/** 监督决策状态（Phase 14） */
export type WorkflowSupervisorDecisionStatus = 'suggested' | 'applied' | 'dismissed'

/** 流程监督决策（Phase 14） */
export interface WorkflowSupervisorDecision {
  id: string
  workflowInstanceId: string
  workflowInstanceNodeId?: string
  supervisorAgentTemplateId: string
  decisionType: WorkflowSupervisorDecisionType
  reason: string
  reasonZh: string
  suggestedNextAction: string
  relatedErrorSummary?: string
  status: WorkflowSupervisorDecisionStatus
  createdAt: string
  updatedAt: string
}
