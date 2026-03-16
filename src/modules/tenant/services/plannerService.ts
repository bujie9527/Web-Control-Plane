/**
 * 流程规划服务
 * Phase 11：Workflow Planner Agent 1.0
 * 与 28-workflow-planner-agent-rules 一致
 * 页面不直接写死 Planner 逻辑，通过本 service 层组织规划流程
 */
import type { WorkflowPlanningDraft, WorkflowPlanningDraftNode } from '../schemas/workflowPlanningSession'
import {
  getPlanningSessionById,
  listPlanningDrafts,
  listPlanningMessages,
  getPlanningDraftById,
  createPlanningDraft,
  addPlanningMessage,
  setCurrentDraft,
} from './workflowPlanningSessionService'
import { validatePlanningDraft, type ValidationResult } from './workflowPlanningValidator'
import {
  generateDraftByPlannerLLM,
  reviseDraftByPlannerLLM,
  clarifyOrGenerateByPlannerLLM,
} from './workflowPlannerLLMAdapter'
import { getSkillList } from '@/modules/platform/services/skillService'
import type { WorkflowPlanningMessage } from '../schemas/workflowPlanningSession'

/** handlePlannerChat 返回：澄清阶段仅追加助手消息；生成阶段返回新草案与校验结果 */
export type HandlePlannerChatResult =
  | { phase: 'clarifying'; message: WorkflowPlanningMessage }
  | { phase: 'generating'; draft: WorkflowPlanningDraft; validation: ValidationResult }

/**
 * 无草案时：先由 AI 判断是澄清还是生成。
 * 澄清则追加助手追问消息并返回 phase=clarifying；
 * 生成则调用 generateInitialDraftFromSession 并返回 phase=generating。
 */
export async function handlePlannerChat(
  sessionId: string,
  userMessage: string
): Promise<HandlePlannerChatResult> {
  const session = await getPlanningSessionById(sessionId)
  if (!session) throw new Error('规划会话不存在')

  const messages = await listPlanningMessages(sessionId)
  const userMessageCount = messages.filter((m) => m.role === 'user').length
  const isMock = session.plannerExecutionBackend === 'mock'

  if (isMock) {
    if (userMessageCount <= 1) {
      const clarifyContent =
        '为了更准确地产出流程草案，请补充：目标受众是谁？希望多久执行一次（日/周/月）？是否有必须经过人工审核的环节？'
      const msg = await addPlanningMessage({
        sessionId,
        role: 'assistant',
        content: clarifyContent,
        messageType: 'summary',
      })
      return { phase: 'clarifying', message: msg }
    }
    const { draft, validation } = await generateInitialDraftFromSession(sessionId)
    return { phase: 'generating', draft, validation }
  }

  const clarifyResult = await clarifyOrGenerateByPlannerLLM(session, userMessage)
  if (!clarifyResult.ok) {
    await addPlanningMessage({
      sessionId,
      role: 'assistant',
      content: clarifyResult.errorMessageZh,
      messageType: 'risk',
    })
    throw new Error(clarifyResult.errorMessageZh)
  }

  if (clarifyResult.data.phase === 'clarifying') {
    const content =
      (clarifyResult.data.clarifyQuestion || '请补充一些关键信息以便生成流程草案。') +
      (clarifyResult.data.clarifyReason ? `\n\n原因：${clarifyResult.data.clarifyReason}` : '')
    const msg = await addPlanningMessage({
      sessionId,
      role: 'assistant',
      content,
      messageType: 'summary',
    })
    return { phase: 'clarifying', message: msg }
  }

  const { draft, validation } = await generateInitialDraftFromSession(sessionId)
  return { phase: 'generating', draft, validation }
}

/** 生成初稿：解析 SOP → 生成 Draft v1 → 校验 → 写入消息 → 设为当前 */
export async function generateInitialDraftFromSession(sessionId: string): Promise<{
  draft: WorkflowPlanningDraft
  validation: ValidationResult
}> {
  const session = await getPlanningSessionById(sessionId)
  if (!session) throw new Error('规划会话不存在')

  const drafts = await listPlanningDrafts(sessionId)
  const nextVersion = drafts.length + 1

  const useLLM = session.plannerExecutionBackend === 'llm'
  const llmResult = useLLM ? await generateDraftByPlannerLLM(session) : null
  if (llmResult && !llmResult.ok) {
    await addPlanningMessage({
      sessionId,
      role: 'assistant',
      content: llmResult.errorMessageZh,
      messageType: 'risk',
      relatedDraftVersion: drafts[0]?.version,
    })
    throw new Error(llmResult.errorMessageZh)
  }
  const nodes = llmResult?.ok ? llmResult.data.nodes : parseSOPToNodes(session.sourceText || '')
  const suggestedAgentIds =
    llmResult?.ok
      ? llmResult.data.suggestedAgentTemplateIds
      : ['at-facebook-content-creator', 'at-content-reviewer', 'at-publisher']
  const suggestedSkillIds =
    llmResult?.ok
      ? llmResult.data.suggestedSkillIds
      : ['skill-content-write', 'skill-content-review', 'skill-publish']

  // 先校验，再落库，防止失败覆盖当前 Draft
  const virtualDraft: WorkflowPlanningDraft = {
    id: `virtual-${Date.now()}`,
    sessionId,
    version: nextVersion,
    summary: llmResult?.ok ? llmResult.data.summary : `初稿 v${nextVersion}：基于 SOP 生成`,
    parsedSOP: session.sourceText,
    nodes,
    suggestedAgentTemplateIds: suggestedAgentIds,
    suggestedSkillIds,
    changeSummary: llmResult?.ok ? llmResult.data.changeSummary : '根据 SOP 原文生成初版流程草案',
    riskNotes:
      llmResult?.ok
        ? llmResult.data.riskNotes
        : nodes.length === 0
          ? 'SOP 原文为空或无法解析，请补充说明'
          : undefined,
    missingCapabilities: llmResult?.ok ? llmResult.data.missingCapabilities : undefined,
    capabilityNotes: llmResult?.ok ? llmResult.data.capabilityNotes : undefined,
    status: 'suggested',
    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
  }

  const skillRes = await getSkillList({ page: 1, pageSize: 999, status: 'active' }).catch(() => ({ items: [] }))
  const availableSkillIds = new Set((skillRes.items ?? []).map((s) => s.id))
  const validation = await validatePlanningDraft(virtualDraft, {
    projectTypeId: session.projectTypeId,
    goalTypeId: session.goalTypeId,
    deliverableMode: session.deliverableMode,
    availableSkillIds,
  })
  if (!validation.isValid) {
    await addPlanningMessage({
      sessionId,
      role: 'assistant',
      content: '草案未通过规则校验，已保留当前版本',
      messageType: 'risk',
      relatedDraftVersion: drafts[0]?.version,
    })
    throw new Error('草案未通过规则校验，已保留当前版本')
  }

  const draft = await createPlanningDraft({
    sessionId,
    version: nextVersion,
    summary: virtualDraft.summary,
    parsedSOP: virtualDraft.parsedSOP,
    nodes,
    suggestedAgentTemplateIds: suggestedAgentIds,
    suggestedSkillIds,
    changeSummary: virtualDraft.changeSummary,
    riskNotes: virtualDraft.riskNotes,
    missingCapabilities: virtualDraft.missingCapabilities,
    capabilityNotes: virtualDraft.capabilityNotes,
    status: 'suggested',
  })

  await addPlanningMessage({
    sessionId,
    role: 'assistant',
    content: `已生成初稿 v${nextVersion}，包含 ${nodes.length} 个节点。${validation.normalizedSummary}`,
    messageType: 'summary',
    relatedDraftVersion: nextVersion,
  })

  await setCurrentDraft(sessionId, draft.id)
  return { draft, validation }
}

/** 应用修改建议：读取当前 Draft + 最新用户消息 → 修订 → 新版 Draft → 校验 → 写入 changeSummary/riskNotes → 更新当前 */
export async function reviseDraftFromUserMessage(
  sessionId: string,
  messageId: string
): Promise<{
  draft: WorkflowPlanningDraft
  validation: ValidationResult
}> {
  const session = await getPlanningSessionById(sessionId)
  if (!session?.currentDraftId) throw new Error('当前无草案可修订')

  const baseDraft = await getPlanningDraftById(session.currentDraftId)
  if (!baseDraft) throw new Error('当前草案不存在')

  const messages = await listPlanningMessages(sessionId)
  const userMsg = messages.find((m) => m.id === messageId) ?? messages.filter((m) => m.role === 'user').pop()
  const userContent = userMsg?.content || '请根据上下文优化流程'

  const llmResult =
    session.plannerExecutionBackend === 'llm'
      ? await reviseDraftByPlannerLLM(session, baseDraft, userContent)
      : null
  if (llmResult && !llmResult.ok) {
    await addPlanningMessage({
      sessionId,
      role: 'assistant',
      content: llmResult.errorMessageZh,
      messageType: 'risk',
      relatedDraftVersion: baseDraft.version,
    })
    throw new Error(llmResult.errorMessageZh)
  }
  const revisedNodes = llmResult?.ok ? llmResult.data.nodes : reviseNodesFromFeedback(baseDraft.nodes, userContent)
  const drafts = await listPlanningDrafts(sessionId)
  const nextVersion = drafts.length + 1

  const changeSummary =
    (llmResult && llmResult.ok ? llmResult.data.changeSummary : undefined) ??
    `根据用户反馈修订：${userContent.slice(0, 80)}${userContent.length > 80 ? '...' : ''}`
  const riskNotes =
    (llmResult && llmResult.ok ? llmResult.data.riskNotes : undefined) ??
    (revisedNodes.some((n) => !n.recommendedAgentTemplateId && n.executionType === 'agent_task')
      ? '部分 Agent 任务节点未绑定推荐 Agent，建议补充'
      : undefined)
  const suggestedAgentTemplateIds =
    (llmResult && llmResult.ok ? llmResult.data.suggestedAgentTemplateIds : undefined) ??
    baseDraft.suggestedAgentTemplateIds
  const suggestedSkillIds =
    (llmResult && llmResult.ok ? llmResult.data.suggestedSkillIds : undefined) ??
    baseDraft.suggestedSkillIds

  const virtualDraft: WorkflowPlanningDraft = {
    id: `virtual-${Date.now()}`,
    sessionId,
    version: nextVersion,
    summary: (llmResult && llmResult.ok ? llmResult.data.summary : undefined) ?? `修订版 v${nextVersion}`,
    nodes: revisedNodes,
    suggestedAgentTemplateIds,
    suggestedSkillIds,
    changeSummary,
    riskNotes,
    missingCapabilities: (llmResult && llmResult.ok ? llmResult.data.missingCapabilities : undefined) ?? baseDraft.missingCapabilities,
    capabilityNotes: (llmResult && llmResult.ok ? llmResult.data.capabilityNotes : undefined) ?? baseDraft.capabilityNotes,
    status: 'suggested',
    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
  }

  const skillRes = await getSkillList({ page: 1, pageSize: 999, status: 'active' }).catch(() => ({ items: [] }))
  const availableSkillIds = new Set((skillRes.items ?? []).map((s) => s.id))
  const validation = await validatePlanningDraft(virtualDraft, {
    projectTypeId: session.projectTypeId,
    goalTypeId: session.goalTypeId,
    deliverableMode: session.deliverableMode,
    availableSkillIds,
  })
  if (!validation.isValid) {
    await addPlanningMessage({
      sessionId,
      role: 'assistant',
      content: '草案未通过规则校验，已保留当前版本',
      messageType: 'risk',
      relatedDraftVersion: baseDraft.version,
    })
    throw new Error('草案未通过规则校验，已保留当前版本')
  }

  const draft = await createPlanningDraft({
    sessionId,
    version: nextVersion,
    summary: virtualDraft.summary,
    nodes: revisedNodes,
    suggestedAgentTemplateIds,
    suggestedSkillIds,
    changeSummary,
    riskNotes,
    missingCapabilities: virtualDraft.missingCapabilities,
    capabilityNotes: virtualDraft.capabilityNotes,
    status: 'suggested',
  })

  await addPlanningMessage({
    sessionId,
    role: 'assistant',
    content: `已生成修订版 v${nextVersion}。${validation.normalizedSummary}`,
    messageType: 'summary',
    relatedDraftVersion: nextVersion,
  })

  await setCurrentDraft(sessionId, draft.id)
  return { draft, validation }
}

/** 校验草案 */
export async function validatePlanningDraftById(
  draftId: string,
  sessionContext?: {
    projectTypeId: string
    goalTypeId: string
    deliverableMode: string
  }
): Promise<ValidationResult> {
  const draft = await getPlanningDraftById(draftId)
  if (!draft) throw new Error('草案不存在')
  return await validatePlanningDraft(draft, sessionContext)
}

/** 追加流程规划助手消息 */
export async function appendPlannerMessage(
  sessionId: string,
  content: string,
  relatedDraftVersion?: number
): Promise<void> {
  await addPlanningMessage({
    sessionId,
    role: 'assistant',
    content,
    messageType: 'summary',
    relatedDraftVersion,
  })
}

/** 创建下一草案版本 */
export async function createNextDraftVersion(
  sessionId: string,
  baseDraftId: string,
  revisedDraftData: {
    nodes: WorkflowPlanningDraftNode[]
    changeSummary?: string
    riskNotes?: string
    suggestedAgentTemplateIds?: string[]
    suggestedSkillIds?: string[]
  }
): Promise<{ draft: WorkflowPlanningDraft; validation: ValidationResult }> {
  const session = await getPlanningSessionById(sessionId)
  if (!session) throw new Error('规划会话不存在')

  const baseDraft = await getPlanningDraftById(baseDraftId)
  if (!baseDraft) throw new Error('基准草案不存在')

  const drafts = await listPlanningDrafts(sessionId)
  const nextVersion = drafts.length + 1

  const draft = await createPlanningDraft({
    sessionId,
    version: nextVersion,
    summary: `修订版 v${nextVersion}`,
    nodes: revisedDraftData.nodes,
    suggestedAgentTemplateIds:
      revisedDraftData.suggestedAgentTemplateIds ?? baseDraft.suggestedAgentTemplateIds,
    suggestedSkillIds: revisedDraftData.suggestedSkillIds ?? baseDraft.suggestedSkillIds,
    changeSummary: revisedDraftData.changeSummary,
    riskNotes: revisedDraftData.riskNotes,
    status: 'suggested',
  })

  const validation = await validatePlanningDraft(draft, {
    projectTypeId: session.projectTypeId,
    goalTypeId: session.goalTypeId,
    deliverableMode: session.deliverableMode,
  })

  await setCurrentDraft(sessionId, draft.id)
  return { draft, validation }
}

// --- 内部 mock 实现 ---

function parseSOPToNodes(sourceText: string): WorkflowPlanningDraftNode[] {
  if (!sourceText?.trim()) {
    return [
      {
        id: 'wpn-fallback-1',
        key: 'step1',
        name: '步骤 1',
        executionType: 'agent_task',
        intentType: 'create',
        orderIndex: 1,
        dependsOnNodeIds: [],
        recommendedAgentTemplateId: 'at-facebook-content-creator',
        allowedSkillIds: ['skill-content-write'],
      },
    ]
  }
  const lines = sourceText.split(/\n/).filter((l) => l.trim())
  const nodes: WorkflowPlanningDraftNode[] = []
  const stepNames: Record<number, string> = {
    1: '内容生成',
    2: '人工审核',
    3: '发布',
    4: '数据记录',
    5: '结果汇总',
  }
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    nodes.push({
      id: `wpn-gen-${i + 1}`,
      key: `step${i + 1}`,
      name: stepNames[i + 1] || `步骤 ${i + 1}`,
      executionType: i === 1 ? 'human_review' : 'agent_task',
      intentType: i === 1 ? 'review' : i === 2 ? 'publish' : 'create',
      orderIndex: i + 1,
      dependsOnNodeIds: i > 0 ? [nodes[i - 1].id] : [],
      recommendedAgentTemplateId:
        i === 1 ? undefined : i === 2 ? 'at-publisher' : 'at-facebook-content-creator',
      allowedSkillIds: i === 1 ? [] : ['skill-content-write', 'skill-publish'].slice(0, i === 2 ? 1 : 2),
    })
  }
  return nodes.length > 0 ? nodes : parseSOPToNodes('')
}

function reviseNodesFromFeedback(
  baseNodes: WorkflowPlanningDraftNode[],
  feedback: string
): WorkflowPlanningDraftNode[] {
  const ts = Date.now()
  const lower = (feedback || '').toLowerCase().trim()
  let nodes = baseNodes.map((n, i) => ({
    ...n,
    id: `wpn-rev-${ts}-${i}`,
  }))

  if (nodes.length === 0) return nodes

  // 用户说「去掉/删除」→ 删最后一个或名称匹配的节点
  if (/\b(去掉|删除|去掉一个|删掉)\b/.test(lower) || /\b(不要|去掉)(.*?)节点\b/.test(lower)) {
    const nameMatch = lower.match(/(?:去掉|删除|不要)(?:第?\s*(\d+)\s*[个步]?|(\S+))?/)
    if (nameMatch) {
      const ord = nameMatch[1] ? parseInt(nameMatch[1], 10) : null
      const namePart = nameMatch[2] ? nameMatch[2].trim() : null
      if (ord != null && ord >= 1 && ord <= nodes.length) {
        nodes = nodes.filter((_, i) => i + 1 !== ord)
      } else if (namePart) {
        nodes = nodes.filter((n) => !n.name.toLowerCase().includes(namePart))
      }
    }
    if (nodes.length < baseNodes.length) {
      nodes = nodes.map((n, i) => ({ ...n, id: `wpn-rev-${ts}-${i}`, orderIndex: i + 1 }))
      return nodes
    }
    nodes = nodes.slice(0, -1)
    if (nodes.length > 0) {
      nodes = nodes.map((n, i) => ({ ...n, id: `wpn-rev-${ts}-${i}`, orderIndex: i + 1 }))
    }
    return nodes
  }

  // 用户说「增加审核/加审核/加入人工审核」→ 在第一个 agent_task 后插入 human_review
  if (/\b(增加|加入|加|添加)(.*)?(审核|人工)\b/.test(lower) || /\b(需要|要有)(.*)?审核\b/.test(lower)) {
    const firstAgentIdx = nodes.findIndex((n) => n.executionType === 'agent_task')
    if (firstAgentIdx >= 0) {
      const insertAt = firstAgentIdx + 1
      const prevId = nodes[insertAt - 1]?.id ?? nodes[0]?.id
      const newId = `wpn-rev-${ts}-review`
      const reviewNode: WorkflowPlanningDraftNode = {
        id: newId,
        key: 'review-step',
        name: '人工审核',
        executionType: 'human_review',
        intentType: 'review',
        orderIndex: insertAt + 1,
        dependsOnNodeIds: [prevId],
        allowedSkillIds: [],
      }
      const rest = nodes.slice(insertAt).map((n, i) => ({
        ...n,
        id: `wpn-rev-${ts}-${insertAt + 1 + i}`,
        orderIndex: insertAt + 2 + i,
        dependsOnNodeIds:
          n.dependsOnNodeIds?.length && n.dependsOnNodeIds[0] === prevId ? [newId] : n.dependsOnNodeIds,
      }))
      nodes = [...nodes.slice(0, insertAt), reviewNode, ...rest]
      nodes = nodes.map((n, i) => ({ ...n, orderIndex: i + 1 }))
    }
    return nodes
  }

  // 用户说「分支/两种/并行」→ 复制最后一个节点为并列（共享同一前置）
  if (/\b(分支|两种|两个|并行|并列)\b/.test(lower)) {
    const last = nodes[nodes.length - 1]
    if (last) {
      const predId = last.dependsOnNodeIds?.[0] ?? (nodes.length > 1 ? nodes[nodes.length - 2]?.id : undefined)
      const branchId = `wpn-rev-${ts}-branch`
      const branchNode: WorkflowPlanningDraftNode = {
        ...last,
        id: branchId,
        key: `${last.key}-branch`,
        name: `${last.name}（分支）`,
        orderIndex: nodes.length + 1,
        dependsOnNodeIds: predId ? [predId] : [],
      }
      nodes = [...nodes, branchNode]
    }
    return nodes
  }

  return nodes
}
