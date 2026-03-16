/**
 * 统一删除确认与结果提示工具
 */
import type { DeleteResult } from '@/core/types/deleteResult'
import { DELETE_REASON_MESSAGES } from '@/core/types/deleteResult'

export interface DeleteConfirmOptions {
  entityName: string
  entityLabel?: string
}

export function confirmDelete(opts: DeleteConfirmOptions): boolean {
  const label = opts.entityLabel ?? opts.entityName
  return window.confirm(`确认删除「${label}」吗？删除后无法恢复。`)
}

export function getDeleteResultMessage(result: DeleteResult): string {
  if (result.success) {
    return result.message || '删除成功'
  }
  if (result.reasonCode) {
    return DELETE_REASON_MESSAGES[result.reasonCode] || result.message
  }
  return result.message || '删除失败'
}

export function buildDeleteResult(
  entityId: string,
  success: boolean,
  action: DeleteResult['action'] = 'deleted',
  message = '',
  reasonCode?: DeleteResult['reasonCode']
): DeleteResult {
  return { success, action, entityId, message, reasonCode }
}

export function buildBlockedResult(
  entityId: string,
  reasonCode: NonNullable<DeleteResult['reasonCode']>
): DeleteResult {
  return {
    success: false,
    action: 'blocked',
    entityId,
    message: DELETE_REASON_MESSAGES[reasonCode],
    reasonCode,
  }
}
