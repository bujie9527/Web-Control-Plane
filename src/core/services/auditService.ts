import type { AuditRecordInput } from '../types/audit'

/**
 * 审计记录占位：后续可写入存储或上报；关键资源写操作处可调用 record()
 */
export async function record(input: AuditRecordInput): Promise<void> {
  const log = {
    ...input,
    id: `audit_${Date.now()}`,
    createdAt: new Date().toISOString(),
  }
  if (typeof console !== 'undefined') {
    // eslint-disable-next-line no-console -- audit debug in dev
    console.debug('[audit]', log)
  }
}
