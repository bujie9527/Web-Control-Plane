/**
 * 统一删除操作结果类型
 * 用于所有后台管理对象的删除 API 返回结构
 */

export type DeleteReasonCode =
  | 'SYSTEM_BUILT_IN'
  | 'IN_USE'
  | 'NOT_FOUND'
  | 'ALREADY_DELETED'

export type DeleteAction = 'deleted' | 'archived' | 'blocked'

export interface DeleteResult {
  success: boolean
  action: DeleteAction
  entityId: string
  message: string
  reasonCode?: DeleteReasonCode
}

export const DELETE_REASON_MESSAGES: Record<DeleteReasonCode, string> = {
  SYSTEM_BUILT_IN: '系统内置对象不可删除，只能停用或隐藏',
  IN_USE: '该对象正在被引用，无法直接删除',
  NOT_FOUND: '对象不存在或已被删除',
  ALREADY_DELETED: '该对象已被删除',
}
