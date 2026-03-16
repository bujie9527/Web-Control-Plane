/**
 * Agent 类型，与 04-core-domain-model 一致
 */
export type AgentStatus = 'active' | 'inactive'

export interface Agent {
  id: string
  tenantId: string
  name: string
  roleName: string
  description?: string
  model?: string
  promptVersion?: string
  status: AgentStatus
  createdAt: string
  updatedAt: string
}
