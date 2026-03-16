/**
 * 租户流程模板 Service
 * 仅暴露租户允许的操作，禁止修改 supportedProjectTypeId、supportedGoalTypeIds、supportedDeliverableModes、sourceTemplateId
 */
import type { WorkflowTemplate } from '../schemas/workflowExecution'
import { getWorkflowTemplateById, updateWorkflowTemplate } from './workflowTemplateFactoryService'
import { changeWorkflowTemplateStatus } from './workflowTemplateFactoryService'

/** 租户可更新的模板字段 */
export interface TenantWorkflowTemplateUpdatePayload {
  name?: string
  description?: string
}

/** 租户可用的状态 */
export type TenantWorkflowTemplateStatus = 'draft' | 'active' | 'archived'

export async function getTenantTemplateById(id: string): Promise<WorkflowTemplate | null> {
  return getWorkflowTemplateById(id)
}

export async function updateTenantTemplate(
  id: string,
  payload: TenantWorkflowTemplateUpdatePayload
): Promise<WorkflowTemplate | null> {
  return updateWorkflowTemplate(id, payload)
}

export async function changeTenantTemplateStatus(
  id: string,
  status: TenantWorkflowTemplateStatus
): Promise<WorkflowTemplate | null> {
  return changeWorkflowTemplateStatus(id, status)
}
