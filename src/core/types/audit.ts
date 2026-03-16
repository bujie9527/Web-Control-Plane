/**
 * 审计日志类型，与 04/06 一致，预留审计记录结构
 */
export interface AuditLog {
  id: string
  scope: string
  actorId: string
  actorType: string
  targetType: string
  targetId: string
  action: string
  result: string
  detail?: string
  createdAt: string
}

export interface AuditRecordInput {
  scope: string
  actorId: string
  actorType: string
  targetType: string
  targetId: string
  action: string
  result: string
  detail?: string
}
