/**
 * 流程运行日志 Mock（Phase 13）
 */
import type { WorkflowRuntimeLog, WorkflowRuntimeLogEventType } from '../schemas/workflowExecution'

/** 初始种子日志，便于详情页展示 */
const _logs: WorkflowRuntimeLog[] = [
  { id: 'wrl1', workflowInstanceId: 'wi1', eventType: 'workflow_started', message: '流程开始执行', createdAt: '2025-03-08 09:00' },
  { id: 'wrl2', workflowInstanceId: 'wi1', workflowInstanceNodeId: 'in1-1', eventType: 'node_started', message: '节点「内容撰写」开始', createdAt: '2025-03-08 09:00' },
  { id: 'wrl3', workflowInstanceId: 'wi1', workflowInstanceNodeId: 'in1-1', eventType: 'node_completed', message: '节点「内容撰写」已完成', createdAt: '2025-03-08 09:45' },
  { id: 'wrl4', workflowInstanceId: 'wi1', workflowInstanceNodeId: 'in1-2', eventType: 'node_started', message: '节点「人工审核」开始', createdAt: '2025-03-08 09:46' },
  { id: 'wrl5', workflowInstanceId: 'wi2', eventType: 'workflow_started', message: '流程开始执行', createdAt: '2025-03-08 08:00' },
  { id: 'wrl6', workflowInstanceId: 'wi2', workflowInstanceNodeId: 'in2-3', eventType: 'waiting_review', message: '节点「人工抽检」等待审核', createdAt: '2025-03-08 08:15' },
  { id: 'wrl7', workflowInstanceId: 'wi6', eventType: 'workflow_started', message: '流程开始执行', createdAt: '2025-03-08 14:00' },
  { id: 'wrl8', workflowInstanceId: 'wi6', workflowInstanceNodeId: 'in6-1', eventType: 'node_started', message: '节点「内容撰写」开始', createdAt: '2025-03-08 14:00' },
  { id: 'wrl9', workflowInstanceId: 'wi6', workflowInstanceNodeId: 'in6-1', eventType: 'node_failed', message: '节点「内容撰写」执行失败：模型调用超时', createdAt: '2025-03-08 14:05' },
  { id: 'wrl10', workflowInstanceId: 'wi6', workflowInstanceNodeId: 'in6-1', eventType: 'node_retry_started', message: '节点已自动重试（第 1 次）', createdAt: '2025-03-08 14:06' },
]

function nextLogId(): string {
  const max = _logs.reduce((m, l) => {
    const n = parseInt(l.id.replace(/\D/g, ''), 10)
    return isNaN(n) ? m : Math.max(m, n)
  }, 0)
  return `wrl${max + 1}`
}

const now = (): string => new Date().toISOString().slice(0, 19).replace('T', ' ')

/** 添加日志 */
export function appendRuntimeLog(
  workflowInstanceId: string,
  eventType: WorkflowRuntimeLogEventType,
  message: string,
  workflowInstanceNodeId?: string
): WorkflowRuntimeLog {
  const log: WorkflowRuntimeLog = {
    id: nextLogId(),
    workflowInstanceId,
    workflowInstanceNodeId,
    eventType,
    message,
    createdAt: now(),
  }
  _logs.push(log)
  return log
}

/** 按实例 ID 查询日志 */
export function getLogsByInstanceId(workflowInstanceId: string): WorkflowRuntimeLog[] {
  return _logs
    .filter((l) => l.workflowInstanceId === workflowInstanceId)
    .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
}
