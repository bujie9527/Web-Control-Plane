import * as repo from '../repositories/projectAgentConfigRepository'
import type { ProjectAgentConfig, UpsertProjectAgentConfigPayload } from '../schemas/projectAgentConfig'

export async function listProjectAgentConfigs(projectId: string): Promise<ProjectAgentConfig[]> {
  const res = await repo.listProjectAgentConfigs(projectId)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function getProjectAgentConfig(
  projectId: string,
  agentTemplateId: string
): Promise<ProjectAgentConfig | null> {
  const res = await repo.getProjectAgentConfig(projectId, agentTemplateId)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function upsertProjectAgentConfig(
  projectId: string,
  agentTemplateId: string,
  payload: UpsertProjectAgentConfigPayload
): Promise<ProjectAgentConfig> {
  const res = await repo.upsertProjectAgentConfig(projectId, agentTemplateId, payload)
  if (res.code !== 0) throw new Error(res.message)
  return res.data
}

export async function deleteProjectAgentConfig(projectId: string, agentTemplateId: string): Promise<boolean> {
  const res = await repo.deleteProjectAgentConfig(projectId, agentTemplateId)
  if (res.code !== 0) throw new Error(res.message)
  return res.data.success
}
