/**
 * 流程监督决策共享：常量与 API→执行层 映射
 * 供 workflowSupervisorService 与 workflowSupervisorRecoveryService 使用，避免重复定义与循环依赖
 */
import type { WorkflowSupervisorDecision } from '../schemas/workflowExecution'

export const SUPERVISOR_AGENT_TEMPLATE_ID = 'at-execution-supervisor'

/** API 返回的决策 → 执行层 WorkflowSupervisorDecision（workflowExecution 形状） */
export function mapApiDecisionToExecution(d: {
  id: string
  instanceId: string
  nodeId?: string | null
  decisionType: string
  reason: string
  suggestedNextAction?: string | null
  relatedErrorSummary?: string | null
  status: string
  createdAt: string
}): WorkflowSupervisorDecision {
  return {
    id: d.id,
    workflowInstanceId: d.instanceId,
    workflowInstanceNodeId: d.nodeId ?? undefined,
    supervisorAgentTemplateId: SUPERVISOR_AGENT_TEMPLATE_ID,
    decisionType: d.decisionType as WorkflowSupervisorDecision['decisionType'],
    reason: d.reason,
    reasonZh: d.reason,
    suggestedNextAction: d.suggestedNextAction ?? '',
    relatedErrorSummary: d.relatedErrorSummary ?? undefined,
    status: d.status as WorkflowSupervisorDecision['status'],
    createdAt: d.createdAt,
    updatedAt: d.createdAt,
  }
}
