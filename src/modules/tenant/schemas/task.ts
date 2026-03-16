/**
 * 任务类型，与 04-core-domain-model 一致
 * 列表展示可加 taskName, projectName, assigneeName
 */
export type TaskStatus = 'pending' | 'running' | 'review' | 'done' | 'failed'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  tenantId: string
  projectId?: string
  /** @deprecated 建议使用 workflowInstanceId */
  workflowId?: string
  status: TaskStatus
  priority: TaskPriority
  createdAt: string
  updatedAt: string
  taskName?: string
  projectName?: string
  assigneeName?: string
  /** 本任务使用的身份 ID（来自项目已绑定身份） */
  identityId?: string
  /** 展示用：身份名称 */
  identityName?: string
  /** 展示用：身份类型 */
  identityType?: string
  /** 展示用：核心定位摘要 */
  identityCorePositioningSummary?: string
  /** 关联的流程模板 ID（冗余，便于展示） */
  workflowTemplateId?: string
  /** 关联的流程实例 ID；来自流程的任务应必填 */
  workflowInstanceId?: string
  /** 当前/关联的流程实例节点 ID */
  workflowNodeId?: string
  /** 当前节点 key，与 WorkflowInstance.currentNodeKey 一致 */
  currentNodeKey?: string
}
