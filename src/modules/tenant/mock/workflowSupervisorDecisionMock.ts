/**
 * 流程监督决策 Mock（Phase 14）
 * 存储 Supervisor Agent 生成的结构化建议
 */
import type {
  WorkflowSupervisorDecision,
  WorkflowSupervisorDecisionStatus,
} from '../schemas/workflowExecution'

const _decisions: WorkflowSupervisorDecision[] = []

function nextId(): string {
  const max = _decisions.reduce((m, d) => {
    const n = parseInt(d.id.replace(/\D/g, ''), 10)
    return isNaN(n) ? m : Math.max(m, n)
  }, 0)
  return `wsd${max + 1}`
}

const now = (): string => new Date().toISOString().slice(0, 19).replace('T', ' ')

export function createDecision(decision: Omit<WorkflowSupervisorDecision, 'id' | 'createdAt' | 'updatedAt'>): WorkflowSupervisorDecision {
  const d: WorkflowSupervisorDecision = {
    ...decision,
    id: nextId(),
    createdAt: now(),
    updatedAt: now(),
  }
  _decisions.push(d)
  return d
}

export function getDecisionById(id: string): WorkflowSupervisorDecision | null {
  return _decisions.find((d) => d.id === id) ?? null
}

export function getDecisionsByInstanceId(workflowInstanceId: string): WorkflowSupervisorDecision[] {
  return _decisions
    .filter((d) => d.workflowInstanceId === workflowInstanceId)
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
}

export function updateDecisionStatus(id: string, status: WorkflowSupervisorDecisionStatus): void {
  const d = _decisions.find((x) => x.id === id)
  if (!d) return
  d.status = status
  d.updatedAt = now()
}
