import type {
  WorkflowPlanningSession,
  WorkflowPlanningDraft,
  WorkflowPlanningMessage,
  PlanningSessionStatus,
} from '../schemas/workflowPlanningSession'
import type { PlanningSessionListParams } from '../schemas/workflowPlanningSession'
import * as repo from '../repositories/workflowPlanningSessionRepository'

export async function listPlanningSessions(params: PlanningSessionListParams): Promise<{
  items: WorkflowPlanningSession[]
  total: number
}> {
  const res = await repo.fetchListPlanningSessions(params)
  return res.data
}

export async function getPlanningSessionById(id: string): Promise<WorkflowPlanningSession | null> {
  const res = await repo.fetchGetPlanningSessionById(id)
  return res.data
}

export async function createPlanningSession(
  payload: Omit<WorkflowPlanningSession, 'id' | 'createdAt' | 'updatedAt'>
): Promise<WorkflowPlanningSession> {
  const res = await repo.fetchCreatePlanningSession(payload)
  return res.data
}

export async function updatePlanningSessionStatus(
  id: string,
  status: PlanningSessionStatus
): Promise<WorkflowPlanningSession | null> {
  const res = await repo.fetchUpdatePlanningSessionStatus(id, status)
  return res.data
}

export async function setCurrentDraft(
  sessionId: string,
  draftId: string
): Promise<WorkflowPlanningSession | null> {
  const res = await repo.fetchSetCurrentDraft(sessionId, draftId)
  return res.data
}

export async function createPlanningDraft(
  payload: Parameters<typeof repo.fetchCreatePlanningDraft>[0]
): Promise<WorkflowPlanningDraft> {
  const res = await repo.fetchCreatePlanningDraft(payload)
  return res.data
}

export async function listPlanningDrafts(sessionId: string): Promise<WorkflowPlanningDraft[]> {
  const res = await repo.fetchListPlanningDrafts(sessionId)
  return res.data
}

export async function getPlanningDraftById(id: string): Promise<WorkflowPlanningDraft | null> {
  const res = await repo.fetchGetPlanningDraftById(id)
  return res.data
}

export async function addPlanningMessage(
  payload: Omit<WorkflowPlanningMessage, 'id' | 'createdAt'>
): Promise<WorkflowPlanningMessage> {
  const res = await repo.fetchAddPlanningMessage(payload)
  return res.data
}

export async function listPlanningMessages(sessionId: string): Promise<WorkflowPlanningMessage[]> {
  const res = await repo.fetchListPlanningMessages(sessionId)
  return res.data
}

export async function deletePlanningSession(id: string): Promise<boolean> {
  const res = await repo.fetchDeletePlanningSession(id)
  return res.data
}
