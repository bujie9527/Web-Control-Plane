/**
 * Workflow 类型，与 04-core-domain-model 一致
 */
export type WorkflowStatus = 'active' | 'inactive'

export interface Workflow {
  id: string
  tenantId: string
  name: string
  type?: string
  description?: string
  version?: string
  status: WorkflowStatus
  createdAt: string
  updatedAt: string
}
