/**
 * 流程运行中心前台中文映射（Phase 13）
 * WorkflowInstance、WorkflowInstanceNode、WorkflowRuntimeLog
 */
import type {
  WorkflowInstanceStatus,
  WorkflowInstanceNodeStatus,
  WorkflowRuntimeLogEventType,
  WorkflowNodeExecutionType,
  WorkflowNodeIntentType,
  WorkflowNodeType,
  WorkflowExecutorType,
  WorkflowSupervisorDecisionType,
  WorkflowSupervisorDecisionStatus,
  RetryStrategy,
  RecoveryStatus,
} from '@/modules/tenant/schemas/workflowExecution'

/** 流程实例状态 */
export const WORKFLOW_INSTANCE_STATUS_LABELS: Record<WorkflowInstanceStatus, string> = {
  draft: '草稿',
  pending: '待执行',
  running: '执行中',
  waiting_review: '等待审核',
  success: '已完成',
  failed: '失败',
  canceled: '已取消',
}

/** 流程实例节点状态 */
export const WORKFLOW_INSTANCE_NODE_STATUS_LABELS: Record<WorkflowInstanceNodeStatus, string> = {
  pending: '待执行',
  running: '执行中',
  waiting_review: '等待审核',
  completed: '已完成',
  failed: '失败',
  skipped: '已跳过',
}

export const RUNTIME_LOG_EVENT_TYPE_LABELS: Record<WorkflowRuntimeLogEventType, string> = {
  workflow_started: '流程开始',
  node_started: '节点开始',
  node_completed: '节点完成',
  node_failed: '节点失败',
  waiting_review: '等待审核',
  manual_continue: '人工继续',
  workflow_completed: '流程完成',
  workflow_paused: '流程暂停',
  workflow_aborted: '流程已中止',
  node_retry: '节点重试',
  node_retry_started: '节点重试开始',
  node_retry_completed: '节点重试完成',
  fallback_agent_used: '已切换备用 Agent',
  fallback_skill_used: '已切换备用 Skill',
  recovery_manual_review: '恢复转人工审核',
  recovery_paused: '恢复暂停',
  recovery_aborted: '恢复中止',
  restart_previous_node: '回退上一节点',
  worker_llm_execution_started: '开始执行 Worker AI',
  worker_llm_execution_completed: 'Worker AI 执行完成',
  worker_llm_execution_failed: 'Worker AI 执行失败',
}

/** 节点执行类型（复用） */
export const EXECUTION_TYPE_LABELS: Record<WorkflowNodeExecutionType, string> = {
  agent_task: 'Agent 任务',
  human_review: '人工审核',
  approval_gate: '审批关口',
  result_writer: '结果写入',
  system_task: '系统任务',
  manual_input: '人工输入',
  branch_decision: '分支决策',
}

/** 节点类型（nodeType） */
export const NODE_TYPE_LABELS: Record<WorkflowNodeType, string> = {
  manual: '人工',
  agent: 'Agent',
  review: '审核',
  system: '系统',
  other: '其他',
}

/** 执行者类型（executorType） */
export const EXECUTOR_TYPE_LABELS: Record<WorkflowExecutorType, string> = {
  human: '人工',
  agent: 'Agent',
  system: '系统',
  api: 'API',
}

/** 节点意图类型（复用） */
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

/** 人工操作按钮文案 */
export const MANUAL_ACTION_LABELS: Record<string, string> = {
  retry_node: '重试节点',
  pause_workflow: '暂停流程',
  continue_workflow: '继续执行',
  approve_review: '标记审核通过',
}

/** 监督决策类型（Phase 14/16） */
export const SUPERVISOR_DECISION_TYPE_LABELS: Record<WorkflowSupervisorDecisionType, string> = {
  retry: '重试节点',
  skip: '跳过节点',
  manual_review: '人工审核',
  pause_workflow: '暂停流程',
  continue_workflow: '继续执行',
  abort_workflow: '中止流程',
  no_action: '无需操作',
  replace_agent: '替换执行 Agent',
  replace_skill: '替换执行 Skill',
  restart_previous_node: '回退上一节点',
}

/** 重试策略（Phase 16） */
export const RETRY_STRATEGY_LABELS: Record<RetryStrategy, string> = {
  same_agent: '同 Agent 重试',
  fallback_agent: '切换备用 Agent',
  fallback_skill: '切换备用 Skill',
}

/** 恢复状态（Phase 16） */
export const RECOVERY_STATUS_LABELS: Record<RecoveryStatus, string> = {
  none: '无',
  retrying: '重试中',
  fallback_agent: '已切换备用 Agent',
  fallback_skill: '已切换备用 Skill',
  manual_review: '等待人工审核',
  paused: '已暂停',
}

/** 监督决策状态（Phase 14） */
export const SUPERVISOR_DECISION_STATUS_LABELS: Record<WorkflowSupervisorDecisionStatus, string> = {
  suggested: '建议中',
  applied: '已应用',
  dismissed: '已忽略',
}
