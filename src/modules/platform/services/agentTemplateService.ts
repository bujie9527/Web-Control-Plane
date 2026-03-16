import type {
  AgentTemplate,
  AgentTemplateListParams,
  AgentTemplateStatus,
  CloneAgentTemplatePayload,
  CreateAgentTemplatePayload,
  ListResult,
} from '../schemas/agentTemplate'
import * as agentTemplateRepo from '../repositories/agentTemplateRepository'

export async function getTemplateList(params: AgentTemplateListParams): Promise<ListResult<AgentTemplate>> {
  const res = await agentTemplateRepo.listTemplates(params)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function getTemplateById(id: string): Promise<AgentTemplate | null> {
  const res = await agentTemplateRepo.getTemplateById(id)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function createTemplate(payload: CreateAgentTemplatePayload): Promise<AgentTemplate> {
  const res = await agentTemplateRepo.createTemplate(payload)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function updateTemplate(id: string, payload: Partial<AgentTemplate>): Promise<AgentTemplate | null> {
  const res = await agentTemplateRepo.updateTemplate(id, payload)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function cloneTemplate(
  id: string,
  payload: CloneAgentTemplatePayload
): Promise<AgentTemplate | null> {
  const res = await agentTemplateRepo.cloneTemplate(id, payload)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function changeStatus(id: string, status: AgentTemplateStatus): Promise<AgentTemplate | null> {
  const res = await agentTemplateRepo.changeStatus(id, status)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function deleteTemplate(id: string): Promise<{ success: boolean; reason?: string }> {
  const res = await agentTemplateRepo.deleteTemplate(id)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

/** Agent 模板被引用信息（Phase 12.6） */
export interface AgentTemplateReferences {
  workflowTemplateNodes: Array<{ nodeId: string; nodeKey: string; nodeName: string; templateId: string; templateName?: string }>
  workflowPlanningDraftNodes: Array<{
    draftId: string
    sessionId: string
    nodeKey: string
    nodeName: string
    draftVersion: number
  }>
}

export async function getAgentTemplateReferences(agentTemplateId: string): Promise<AgentTemplateReferences> {
  return agentTemplateRepo.getAgentTemplateReferences(agentTemplateId)
}
