/**
 * AgentTeam 类型，与 04-core-domain-model 一致
 */
export type AgentTeamStatus = 'active' | 'inactive'

export interface AgentTeam {
  id: string
  tenantId: string
  name: string
  description?: string
  status: AgentTeamStatus
  createdAt: string
  updatedAt: string
}
