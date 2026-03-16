/**
 * 流程规划会话 Mock
 * Phase 10：Workflow Planning Session 1.0
 */
import type {
  WorkflowPlanningSession,
  WorkflowPlanningDraft,
  WorkflowPlanningDraftNode,
  WorkflowPlanningMessage,
  PlanningSessionStatus,
  PlanningSourceType,
  PlanningMessageRole,
  PlanningMessageType,
} from '../schemas/workflowPlanningSession'

const now = (): string => new Date().toISOString().slice(0, 19).replace('T', ' ')

const _sessions: WorkflowPlanningSession[] = []
const _drafts: WorkflowPlanningDraft[] = []
const _messages: WorkflowPlanningMessage[] = []

const STORAGE_KEY = 'awcc_planning_sessions'
const STORAGE_INITIALIZED_KEY = 'awcc_planning_sessions_initialized'

function isStorageInitialized(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false
    return localStorage.getItem(STORAGE_INITIALIZED_KEY) === '1'
  } catch {
    return false
  }
}

function markStorageInitialized() {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(STORAGE_INITIALIZED_KEY, '1')
  } catch {
    // ignore
  }
}

function loadStoredSessions(): WorkflowPlanningSession[] {
  try {
    if (typeof localStorage === 'undefined') return []
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as WorkflowPlanningSession[]
  } catch {
    return []
  }
}

function saveStoredSessions() {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_sessions))
    markStorageInitialized()
  } catch {
    // ignore
  }
}

function nextSessionId(): string {
  return `wps-${Date.now()}`
}
function nextDraftId(): string {
  return `wpd-${Date.now()}`
}
function nextMessageId(): string {
  return `wpm-${Date.now()}`
}
function nextNodeId(): string {
  return `wpn-${Date.now()}`
}

/** 种子数据 + 本地持久化恢复（仅首次未初始化时写入种子） */
function seed() {
  if (_sessions.length > 0) return

  // 若 localStorage 已被使用过（用户操作过），直接从 localStorage 恢复，不再注入种子数据
  if (isStorageInitialized()) {
    const stored = loadStoredSessions()
    stored.forEach((s) => {
      if (!_sessions.find((x) => x.id === s.id)) {
        _sessions.push(s)
      }
    })
    return
  }

  // 首次使用：注入演示种子数据
  const s1: WorkflowPlanningSession = {
    id: 'wps-seed-1',
    scopeType: 'tenant',
    tenantId: 't1',
    title: '社媒日更流程规划',
    description: '基于 SOP 共创流程（演示数据）',
    projectTypeId: 'pt-account-operation',
    goalTypeId: 'gt-account-followers',
    deliverableMode: 'social_content',
    sourceType: 'sop_input',
    sourceText: '1. 每日生成 3 篇内容\n2. 人工审核后发布\n3. 记录数据',
    plannerExecutionBackend: 'mock',
    currentDraftId: 'wpd-seed-1',
    status: 'in_progress',
    createdBy: 'u1',
    createdAt: now(),
    updatedAt: now(),
  }
  _sessions.push(s1)

  const s2: WorkflowPlanningSession = {
    id: 'wps-seed-2',
    scopeType: 'system',
    title: '平台通用内容流程规划',
    description: '系统级流程模板规划（演示数据）',
    projectTypeId: 'pt-website-operation',
    goalTypeId: 'gt-website-traffic',
    deliverableMode: 'seo_article',
    sourceType: 'manual',
    plannerExecutionBackend: 'mock',
    status: 'draft',
    createdBy: 'platform',
    createdAt: now(),
    updatedAt: now(),
  }
  _sessions.push(s2)

  const d1: WorkflowPlanningDraft = {
    id: 'wpd-seed-1',
    sessionId: 'wps-seed-1',
    version: 1,
    summary: '初版草案：3 节点流程',
    nodes: [
      {
        id: 'wpn-1',
        key: 'create',
        name: '内容生成',
        executionType: 'agent_task',
        intentType: 'create',
        orderIndex: 1,
        dependsOnNodeIds: [],
        recommendedAgentTemplateId: 'at-facebook-content-creator',
        allowedAgentRoleTypes: ['creator'],
        allowedSkillIds: ['skill-content-write'],
        executorStrategy: 'semi_auto',
      } as WorkflowPlanningDraftNode,
      {
        id: 'wpn-2',
        key: 'review',
        name: '人工审核',
        executionType: 'human_review',
        intentType: 'review',
        orderIndex: 2,
        dependsOnNodeIds: ['wpn-1'],
        executorStrategy: 'manual',
      } as WorkflowPlanningDraftNode,
      {
        id: 'wpn-3',
        key: 'publish',
        name: '发布',
        executionType: 'agent_task',
        intentType: 'publish',
        orderIndex: 3,
        dependsOnNodeIds: ['wpn-2'],
        recommendedAgentTemplateId: 'at-publisher',
        executorStrategy: 'semi_auto',
      } as WorkflowPlanningDraftNode,
    ],
    suggestedAgentTemplateIds: ['at-facebook-content-creator', 'at-content-reviewer', 'at-publisher'],
    suggestedSkillIds: ['skill-content-write', 'skill-content-review', 'skill-publish'],
    changeSummary: '根据 SOP 生成初版流程',
    riskNotes: '需确认审核节点是否必须人工',
    status: 'suggested',
    createdAt: now(),
  }
  _drafts.push(d1)

  _messages.push(
    {
      id: 'wpm-1',
      sessionId: 'wps-seed-1',
      role: 'user' as PlanningMessageRole,
      content: '我有一份 SOP：每日生成 3 篇内容，人工审核后发布，记录数据。请帮我规划流程。',
      messageType: 'chat' as PlanningMessageType,
      createdAt: now(),
    },
    {
      id: 'wpm-2',
      sessionId: 'wps-seed-1',
      role: 'assistant' as PlanningMessageRole,
      content: '已根据您的 SOP 生成初版流程草案，包含 3 个节点：内容生成 → 人工审核 → 发布。',
      relatedDraftVersion: 1,
      messageType: 'summary' as PlanningMessageType,
      createdAt: now(),
    }
  )

  // 标记已初始化并持久化
  saveStoredSessions()
}

export interface PlanningSessionListParams {
  page?: number
  pageSize?: number
  scopeType?: 'system' | 'tenant'
  tenantId?: string
  status?: PlanningSessionStatus
  projectTypeId?: string
  deliverableMode?: string
  sourceType?: PlanningSourceType
}

export function listPlanningSessions(params: PlanningSessionListParams): {
  items: WorkflowPlanningSession[]
  total: number
} {
  seed()
  let list = [..._sessions]
  if (params.tenantId) list = list.filter((s) => s.scopeType === 'system' || s.tenantId === params.tenantId)
  if (params.scopeType) list = list.filter((s) => s.scopeType === params.scopeType)
  if (params.status) list = list.filter((s) => s.status === params.status)
  if (params.projectTypeId) list = list.filter((s) => s.projectTypeId === params.projectTypeId)
  if (params.deliverableMode) list = list.filter((s) => s.deliverableMode === params.deliverableMode)
  if (params.sourceType) list = list.filter((s) => s.sourceType === params.sourceType)
  list.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
  const total = list.length
  const page = params.page ?? 1
  const pageSize = params.pageSize ?? 20
  const start = (page - 1) * pageSize
  return { items: list.slice(start, start + pageSize), total }
}

export function getPlanningSessionById(id: string): WorkflowPlanningSession | null {
  seed()
  return _sessions.find((s) => s.id === id) ?? null
}

export function createPlanningSession(
  payload: Omit<WorkflowPlanningSession, 'id' | 'createdAt' | 'updatedAt'>
): WorkflowPlanningSession {
  seed()
  const session: WorkflowPlanningSession = {
    ...payload,
    id: nextSessionId(),
    createdAt: now(),
    updatedAt: now(),
  }
  _sessions.push(session)
  saveStoredSessions()
  return session
}

export function updatePlanningSessionStatus(
  id: string,
  status: PlanningSessionStatus
): WorkflowPlanningSession | null {
  seed()
  const idx = _sessions.findIndex((s) => s.id === id)
  if (idx < 0) return null
  _sessions[idx] = { ..._sessions[idx], status, updatedAt: now() }
  saveStoredSessions()
  return _sessions[idx]
}

export function setCurrentDraft(sessionId: string, draftId: string): WorkflowPlanningSession | null {
  seed()
  const sIdx = _sessions.findIndex((s) => s.id === sessionId)
  if (sIdx < 0) return null
  const draft = _drafts.find((d) => d.id === draftId && d.sessionId === sessionId)
  if (!draft) return null
  _sessions[sIdx] = { ..._sessions[sIdx], currentDraftId: draftId, updatedAt: now() }
  saveStoredSessions()
  return _sessions[sIdx]
}

export function createPlanningDraft(
  payload: Omit<WorkflowPlanningDraft, 'id' | 'createdAt'> & { sessionId: string }
): WorkflowPlanningDraft {
  seed()
  const version =
    _drafts.filter((d) => d.sessionId === payload.sessionId).reduce((m, d) => Math.max(m, d.version), 0) + 1
  const draft: WorkflowPlanningDraft = {
    ...payload,
    id: nextDraftId(),
    version,
    nodes: payload.nodes.map((n, i) => ({
      ...n,
      id: n.id || nextNodeId(),
      orderIndex: n.orderIndex ?? i + 1,
    })),
    createdAt: now(),
  }
  _drafts.push(draft)
  return draft
}

export function listPlanningDrafts(sessionId: string): WorkflowPlanningDraft[] {
  seed()
  return _drafts.filter((d) => d.sessionId === sessionId).sort((a, b) => b.version - a.version)
}

export function deletePlanningSession(id: string): boolean {
  seed()
  const idx = _sessions.findIndex((s) => s.id === id)
  if (idx < 0) return false
  const sessionId = _sessions[idx].id
  _sessions.splice(idx, 1)
  // 删除关联草案与消息
  for (let i = _drafts.length - 1; i >= 0; i -= 1) {
    if (_drafts[i].sessionId === sessionId) _drafts.splice(i, 1)
  }
  for (let i = _messages.length - 1; i >= 0; i -= 1) {
    if (_messages[i].sessionId === sessionId) _messages.splice(i, 1)
  }
  saveStoredSessions()
  return true
}

/** 查询引用指定 Agent 模板的 WorkflowPlanningDraftNode（Phase 12.6） */
export function getDraftNodesReferencingAgent(agentTemplateId: string): Array<{
  draftId: string
  sessionId: string
  nodeKey: string
  nodeName: string
  draftVersion: number
}> {
  seed()
  const result: Array<{
    draftId: string
    sessionId: string
    nodeKey: string
    nodeName: string
    draftVersion: number
  }> = []
  for (const d of _drafts) {
    for (const n of d.nodes) {
      if (n.recommendedAgentTemplateId === agentTemplateId) {
        result.push({
          draftId: d.id,
          sessionId: d.sessionId,
          nodeKey: n.key,
          nodeName: n.name,
          draftVersion: d.version,
        })
      }
    }
  }
  return result
}

export function getPlanningDraftById(id: string): WorkflowPlanningDraft | null {
  seed()
  return _drafts.find((d) => d.id === id) ?? null
}

export function addPlanningMessage(
  payload: Omit<WorkflowPlanningMessage, 'id' | 'createdAt'>
): WorkflowPlanningMessage {
  seed()
  const msg: WorkflowPlanningMessage = {
    ...payload,
    id: nextMessageId(),
    createdAt: now(),
  }
  _messages.push(msg)
  return msg
}

export function listPlanningMessages(sessionId: string): WorkflowPlanningMessage[] {
  seed()
  return _messages.filter((m) => m.sessionId === sessionId).sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
}
