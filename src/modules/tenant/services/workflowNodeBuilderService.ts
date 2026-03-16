import type { WorkflowTemplateNode } from '../schemas/workflowExecution'
import * as nodeRepo from '../repositories/workflowTemplateNodeRepository'
import { updateWorkflowTemplate } from './workflowTemplateFactoryService'

async function syncNodeCount(templateId: string): Promise<void> {
  const listRes = await nodeRepo.fetchNodesByTemplateId(templateId)
  await updateWorkflowTemplate(templateId, { nodeCount: listRes.data.length })
}

export async function listTemplateNodes(templateId: string): Promise<WorkflowTemplateNode[]> {
  const res = await nodeRepo.fetchNodesByTemplateId(templateId)
  return res.data
}

export async function createNode(
  templateId: string,
  payload: Partial<WorkflowTemplateNode>
): Promise<WorkflowTemplateNode> {
  const res = await nodeRepo.fetchCreateTemplateNode(templateId, payload)
  await syncNodeCount(templateId)
  return res.data
}

export async function updateNode(
  nodeId: string,
  payload: Partial<WorkflowTemplateNode>
): Promise<WorkflowTemplateNode | null> {
  const res = await nodeRepo.fetchUpdateTemplateNode(nodeId, payload)
  return res.data
}

export async function deleteNode(
  templateId: string,
  nodeId: string
): Promise<boolean> {
  const res = await nodeRepo.fetchDeleteTemplateNode(nodeId)
  await syncNodeCount(templateId)
  return res.data
}

export async function reorderNodes(
  templateId: string,
  orderedNodeIds: string[]
): Promise<WorkflowTemplateNode[]> {
  const res = await nodeRepo.fetchReorderTemplateNodes(templateId, orderedNodeIds)
  return res.data
}
