/**
 * 流程节点执行服务（P1-A）
 * 触发服务端执行单个节点，返回更新后的节点
 */
import type { WorkflowInstanceNode } from '../schemas/workflowExecution'
import * as repo from '../repositories/workflowNodeExecutionRepository'

export async function executeNode(
  instanceId: string,
  nodeId: string
): Promise<WorkflowInstanceNode> {
  return repo.triggerNodeExecution(instanceId, nodeId)
}
