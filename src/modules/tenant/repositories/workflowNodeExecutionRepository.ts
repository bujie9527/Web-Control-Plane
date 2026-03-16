/**
 * 流程节点执行 API（P1-A）
 * 调用服务端 POST /api/workflow-instances/:instanceId/nodes/:nodeId/execute
 */
import type { WorkflowInstanceNode } from '../schemas/workflowExecution'
import { parseResponseJson } from '@/core/api/safeParseResponse'

const API_BASE = typeof window !== 'undefined' ? '' : 'http://localhost:3001'

interface ApiResponse<T> {
  code: number
  message: string
  data: T
  meta?: unknown
}

export async function triggerNodeExecution(
  instanceId: string,
  nodeId: string
): Promise<WorkflowInstanceNode> {
  const res = await fetch(
    `${API_BASE}/api/workflow-instances/${instanceId}/nodes/${nodeId}/execute`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }
  )
  const json = await parseResponseJson<ApiResponse<WorkflowInstanceNode>>(res)
  if (res.ok && json.code === 0 && json.data) return json.data
  throw new Error(json.message ?? `HTTP ${res.status}`)
}
