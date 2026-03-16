import type { WorkflowTemplate } from '../schemas/workflowExecution'
import type { WorkflowTemplateListParams } from '../repositories/workflowTemplateRepository'
import * as templateRepo from '../repositories/workflowTemplateRepository'

export async function listWorkflowTemplates(params: WorkflowTemplateListParams): Promise<{
  items: WorkflowTemplate[]
  total: number
}> {
  const res = await templateRepo.fetchListWorkflowTemplates(params)
  return res.data
}

export async function getWorkflowTemplateById(id: string): Promise<WorkflowTemplate | null> {
  const res = await templateRepo.fetchGetWorkflowTemplateById(id)
  return res.data
}

export async function createWorkflowTemplate(
  payload: Parameters<typeof templateRepo.fetchCreateWorkflowTemplate>[0]
): Promise<WorkflowTemplate> {
  const res = await templateRepo.fetchCreateWorkflowTemplate(payload)
  return res.data
}

export async function updateWorkflowTemplate(
  id: string,
  payload: Partial<WorkflowTemplate>
): Promise<WorkflowTemplate | null> {
  const res = await templateRepo.fetchUpdateWorkflowTemplate(id, payload)
  return res.data
}

export async function cloneWorkflowTemplateToTenant(
  id: string,
  tenantId: string
): Promise<WorkflowTemplate | null> {
  const res = await templateRepo.fetchCloneWorkflowTemplateToTenant(id, tenantId)
  return res.data
}

export async function changeWorkflowTemplateStatus(
  id: string,
  status: WorkflowTemplate['status']
): Promise<WorkflowTemplate | null> {
  const res = await templateRepo.fetchChangeWorkflowTemplateStatus(id, status)
  return res.data
}

export async function deleteWorkflowTemplate(
  id: string
): Promise<{ success: boolean; reason?: string }> {
  const res = await templateRepo.fetchDeleteWorkflowTemplate(id)
  return res.data
}
