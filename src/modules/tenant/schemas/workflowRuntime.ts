/**
 * 流程运行态类型定义 — WorkflowRuntimeLog / WorkflowSupervisorDecision
 * 批次 9：对应 Prisma 新增模型
 */

// ─── WorkflowRuntimeLog ──────────────────────────────────────────────────────

export type WorkflowRuntimeEventType =
  | 'workflow_started'
  | 'node_started'
  | 'node_completed'
  | 'node_failed'
  | 'waiting_review'
  | 'manual_continue'
  | 'workflow_completed'
  | 'workflow_paused'
  | 'workflow_aborted'
  | 'supervisor_analyzed'
  | 'worker_llm_execution_started'
  | 'worker_llm_execution_completed'
  | 'worker_llm_execution_failed'
  | 'node_retry_started'
  | 'node_retry_completed'
  | 'fallback_agent_used'
  | 'fallback_skill_used'
  | 'restart_previous_node'
  | 'recovery_aborted'

export interface WorkflowRuntimeLog {
  id: string
  instanceId: string
  nodeId?: string | null
  eventType: WorkflowRuntimeEventType
  messageZh: string
  operatorId?: string | null
  meta?: Record<string, unknown> | null
  createdAt: string
}

export type AppendRuntimeLogPayload = Omit<WorkflowRuntimeLog, 'id' | 'createdAt'>

// ─── 监督决策（类型与状态；权威决策接口见 workflowExecution.WorkflowSupervisorDecision）────

export type SupervisorDecisionType =
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

export type SupervisorDecisionStatus = 'suggested' | 'applied' | 'dismissed'

/** API 创建决策请求体（权威决策接口见 workflowExecution.WorkflowSupervisorDecision） */
export interface CreateSupervisorDecisionPayload {
  instanceId: string
  nodeId?: string | null
  decisionType: SupervisorDecisionType
  reason: string
  suggestedNextAction?: string | null
  relatedErrorSummary?: string | null
}

/** API 返回的监督决策形状（权威执行层接口见 workflowExecution.WorkflowSupervisorDecision） */
export interface SupervisorDecisionApi {
  id: string
  instanceId: string
  nodeId?: string | null
  decisionType: SupervisorDecisionType
  reason: string
  suggestedNextAction?: string | null
  relatedErrorSummary?: string | null
  status: SupervisorDecisionStatus
  appliedBy?: string | null
  appliedAt?: string | null
  createdAt: string
}
