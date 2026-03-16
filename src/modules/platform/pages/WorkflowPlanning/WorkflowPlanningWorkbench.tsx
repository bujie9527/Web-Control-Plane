/**
 * WorkflowPlanningWorkbench
 * 流程规划工作台（三栏形态）
 *
 * 布局：左栏 AI 对话 360px | 中栏文字流程摘要 280px | 右栏流程画布 + 节点检查
 * 画布基于共享 WorkflowGraphEditor，支持缩放、连线、选中与 Inspector 联动
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import {
  getPlanningSessionById,
  listPlanningDrafts,
  listPlanningMessages,
  getPlanningDraftById,
  setCurrentDraft,
  createPlanningDraft,
  addPlanningMessage,
} from '@/modules/tenant/services/workflowPlanningSessionService'
import {
  handlePlannerChat,
  reviseDraftFromUserMessage,
  validatePlanningDraftById,
} from '@/modules/tenant/services/plannerService'
import { getDefaultModelConfig } from '@/modules/tenant/services/llmModelConfigService'
import { publishDraftAsTemplate } from '@/modules/tenant/services/workflowTemplatePublishService'
import { PublishTemplateDialog } from './PublishTemplateDialog'
import { PlannerChatPanel } from './PlannerChatPanel'
import { WorkflowGraphEditor, NodeInspector } from '@/modules/workflow-designer'
import type { WorkflowNodeData } from '@/modules/workflow-designer'
import type {
  WorkflowPlanningSession,
  WorkflowPlanningDraft,
  WorkflowPlanningMessage,
  PlanningSourceType,
} from '@/modules/tenant/schemas/workflowPlanningSession'
import type { ChatMessage } from './PlannerChatPanel'
import type { ValidationResult } from '@/modules/tenant/services/workflowPlanningValidator'
import {
  PLANNING_SESSION_STATUS_LABELS,
  PLANNING_SOURCE_TYPE_LABELS,
  PLANNER_DOMAIN_LABELS,
  PLANNING_PROJECT_TYPE_LABELS,
  PLANNING_GOAL_TYPE_LABELS,
  PLANNING_DELIVERABLE_LABELS,
  PLANNING_LLM_ERROR_LABELS,
} from '@/core/labels/planningDisplayLabels'
import { getTemplateById } from '@/modules/platform/services/agentTemplateService'
import type { AgentTemplate } from '@/modules/platform/schemas/agentTemplate'
import type { LLMModelConfig } from '@/modules/tenant/schemas/llmExecutor'
import { listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import styles from './WorkflowPlanningWorkbench.module.css'

// ─── Props ────────────────────────────────────────────────────────────────────

interface WorkflowPlanningWorkbenchProps {
  listRoute: string
  scopeLabel: string
  allowSystemPublish?: boolean
  tenantId?: string
  publishedBy?: string
  /** 发布成功后跳转，根据 scopeType 返回对应 Template Detail 路由 */
  getTemplateDetailRoute: (templateId: string, scopeType: 'system' | 'tenant') => string
}

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

/**
 * toBackendMessages
 * 将 WorkflowPlanningMessage[] 转换为 ChatMessage[]
 * 补充 isOptimistic=false 等字段
 */
function toBackendMessages(messages: WorkflowPlanningMessage[]): ChatMessage[] {
  return messages.map((m) => ({ ...m, isOptimistic: false, isLoading: false, isError: false }))
}

/**
 * makeTempId
 * 生成乐观更新用的临时 ID（前缀 'temp-'，避免与后端 ID 冲突）
 */
function makeTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/**
 * makeOptimisticUserMessage
 * 创建乐观追加的用户消息（isOptimistic=true）
 * @param sessionId - 当前会话 ID
 * @param content - 用户输入文本
 */
function makeOptimisticUserMessage(sessionId: string, content: string): ChatMessage {
  // TODO: Cursor Tab 补全
  return {
    id: makeTempId(),
    sessionId,
    role: 'user',
    content,
    messageType: 'chat',
    createdAt: new Date().toISOString(),
    isOptimistic: true,
  }
}

/**
 * makeLoadingMessage
 * 创建"助手正在思考..."的 loading 占位消息
 */
function makeLoadingMessage(sessionId: string): ChatMessage {
  return {
    id: makeTempId(),
    sessionId,
    role: 'assistant',
    content: '',
    messageType: 'chat',
    createdAt: new Date().toISOString(),
    isLoading: true,
  }
}

// ─── 可折叠规划上下文条 ───────────────────────────────────────────────────────

function WorkbenchContextBar({
  session,
  plannerTemplate,
  collapsed,
  onToggle,
  labels,
}: {
  session: WorkflowPlanningSession
  plannerTemplate: AgentTemplate | null
  collapsed: boolean
  onToggle: () => void
  labels: {
    plannerDomain: (d: string) => string
    projectType: (id: string) => string
    goalType: (id: string) => string
    deliverable: (m: string) => string
    sourceType: (t: string) => string
  }
}) {
  const domainLabel = plannerTemplate?.plannerDomain
    ? (labels.plannerDomain(plannerTemplate.plannerDomain) ?? plannerTemplate.plannerDomain)
    : '通用'
  const plannerName = plannerTemplate?.nameZh ?? plannerTemplate?.name ?? '—'
  return (
    <div className={styles.contextBar}>
      <button type="button" className={styles.contextBarToggle} onClick={onToggle} aria-expanded={!collapsed}>
        {collapsed ? '▶' : '▼'} 规划上下文
      </button>
      {collapsed ? (
        <div className={styles.contextChips} style={{ padding: '8px 12px' }}>
          <span className={styles.contextChip}>{plannerName}</span>
          <span className={styles.contextChip}>{domainLabel}</span>
          <span className={styles.contextChip}>{labels.projectType(session.projectTypeId)}</span>
          <span className={styles.contextChip}>{labels.goalType(session.goalTypeId)}</span>
          <span className={styles.contextChip}>{labels.deliverable(session.deliverableMode)}</span>
          <span className={styles.contextChip}>{labels.sourceType(session.sourceType)}</span>
        </div>
      ) : (
        <div className={styles.contextBarContent}>
          <div className={styles.kvGrid}>
            <span className={styles.kvLabel}>流程规划助手</span>
            <span>{plannerName}</span>
            <span className={styles.kvLabel}>垂直领域</span>
            <span>{domainLabel}</span>
            <span className={styles.kvLabel}>项目类型</span>
            <span>{labels.projectType(session.projectTypeId)}</span>
            <span className={styles.kvLabel}>目标类型</span>
            <span>{labels.goalType(session.goalTypeId)}</span>
            <span className={styles.kvLabel}>交付模式</span>
            <span>{labels.deliverable(session.deliverableMode)}</span>
            <span className={styles.kvLabel}>来源类型</span>
            <span>{labels.sourceType(session.sourceType)}</span>
            <span className={styles.kvLabel}>SOP 原文</span>
            <span className={styles.sourceText}>
              {(session.sourceText ?? '—').slice(0, 300)}
              {(session.sourceText?.length ?? 0) > 300 ? '...' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

const EXEC_TYPE_LABELS: Record<string, string> = {
  agent_task: 'Agent 任务',
  human_review: '人工审核',
  approval_gate: '审批关口',
  result_writer: '结果写入',
}

/**
 * DraftTextSummaryPanel
 * 中栏：当前草案版本标题、版本切换、节点列表（文字）、修改摘要与风险提示
 * 点击节点卡片 → 右侧画布高亮该节点（onSelectNodeId）
 */
function DraftTextSummaryPanel({
  draft,
  drafts,
  currentDraftId,
  actionLoading,
  selectedNodeId,
  onSwitchDraft,
  onNewDraft,
  onSelectNodeId,
}: {
  draft: WorkflowPlanningDraft | null
  drafts: WorkflowPlanningDraft[]
  currentDraftId?: string
  actionLoading: boolean
  selectedNodeId: string | null
  onSwitchDraft: (draftId: string) => void
  onNewDraft: () => void
  onSelectNodeId: (id: string | null) => void
}) {
  if (!draft) {
    return (
      <div className={styles.summaryColumn}>
        <div className={styles.summaryPanelHeader}>文字流程摘要</div>
        <div className={styles.summaryNodeList} style={{ padding: 12, color: '#999', fontSize: 13 }}>
          暂无草案。发送消息后，流程规划助手将生成流程摘要。
        </div>
      </div>
    )
  }

  const sortedNodes = [...(draft.nodes ?? [])].sort((a, b) => a.orderIndex - b.orderIndex)
  return (
    <div className={styles.summaryColumn}>
      <div className={styles.summaryPanelHeader}>文字流程摘要</div>
      <div className={styles.summaryVersionRow}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          {drafts.map((d) => (
            <button
              key={d.id}
              type="button"
              disabled={actionLoading || currentDraftId === d.id}
              onClick={() => onSwitchDraft(d.id)}
              style={{
                padding: '4px 8px',
                fontSize: 11,
                fontWeight: currentDraftId === d.id ? 600 : 400,
              }}
            >
              {currentDraftId === d.id ? `v${d.version}（当前）` : `v${d.version}`}
            </button>
          ))}
          <button type="button" disabled={actionLoading} onClick={onNewDraft} style={{ fontSize: 11 }}>
            新建版本
          </button>
        </div>
      </div>
      <div className={styles.summaryNodeList}>
        {sortedNodes.map((n) => {
          const isPlaceholder = n.bindingStatus === 'placeholder' || n.bindingStatus === 'missing'
          const isSelected = selectedNodeId === n.id
          return (
            <div
              key={n.id}
              role="button"
              tabIndex={0}
              className={`${styles.summaryNodeCard} ${isSelected ? styles.selected : ''} ${isPlaceholder ? styles.placeholder : ''}`}
              onClick={() => onSelectNodeId(isSelected ? null : n.id)}
              onKeyDown={(e) => e.key === 'Enter' && onSelectNodeId(isSelected ? null : n.id)}
            >
              <span className={styles.summaryNodeCardOrder}>{n.orderIndex}.</span>
              <span className={styles.summaryNodeCardName}>{n.name}</span>
              <div className={styles.summaryNodeCardBadge}>
                {EXEC_TYPE_LABELS[n.executionType] ?? n.executionType}
                {isPlaceholder ? ' · 占位' : ''}
              </div>
            </div>
          )
        })}
      </div>
      {(draft.changeSummary || draft.riskNotes) && (
        <div className={styles.summaryBlockWrap}>
          {draft.changeSummary && (
            <div className={styles.summaryChangeSummary}>
              <strong>修改摘要：</strong>
              {draft.changeSummary}
            </div>
          )}
          {draft.riskNotes && (
            <div className={styles.summaryRiskNotes}>
              <strong>风险提示：</strong>
              {draft.riskNotes}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────

export function WorkflowPlanningWorkbench({
  listRoute,
  scopeLabel,
  allowSystemPublish = false,
  tenantId,
  publishedBy = 'user',
  getTemplateDetailRoute,
}: WorkflowPlanningWorkbenchProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // ── 服务端数据 State ────────────────────────────────────────────────────────
  const [session, setSession] = useState<WorkflowPlanningSession | null>(null)
  const [drafts, setDrafts] = useState<WorkflowPlanningDraft[]>([])
  const [currentDraft, setCurrentDraftState] = useState<WorkflowPlanningDraft | null>(null)
  /** 上一个草案版本（用于后续 diff 高亮等） */
  const [, setPrevDraft] = useState<WorkflowPlanningDraft | null>(null)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [, setDefaultModelConfig] = useState<LLMModelConfig | null>(null)
  const [plannerTemplate, setPlannerTemplate] = useState<AgentTemplate | null>(null)

  // ── 本地消息 State（含乐观更新消息）────────────────────────────────────────
  /**
   * chatMessages
   * 融合了后端历史消息 + 本地乐观追加消息
   * 不直接使用 WorkflowPlanningMessage[]，而是用 ChatMessage[]（扩展类型）
   */
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])

  // ── UI 控制 State ────────────────────────────────────────────────────────────
  const [pageLoading, setPageLoading] = useState(true)
  /** 是否正在等待 LLM 回复（控制输入框 disabled + loading 气泡） */
  const [sending, setSending] = useState(false)
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  /** 画布选中节点 id（与 NodeInspector 联动） */
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  /** 规划上下文条是否折叠（默认折叠） */
  const [contextBarCollapsed, setContextBarCollapsed] = useState(true)

  // ── 初始加载 ────────────────────────────────────────────────────────────────

  /**
   * initialLoad
   * 页面初始化时调用，加载会话、草案列表、消息历史、模型配置、规划助手模板
   *
   * 注意：此函数在乐观更新流程中【不再被 handleSend 调用】
   * 仅在以下情况调用：
   * - 组件挂载
   * - 版本切换（handleSwitchDraft）
   * - 新建草案版本（handleNewDraft）
   */
  const initialLoad = useCallback(async () => {
    if (!id) return
    setPageLoading(true)
    try {
      const [s, dList, mList] = await Promise.all([
        getPlanningSessionById(id),
        listPlanningDrafts(id),
        listPlanningMessages(id),
      ])
      setSession(s ?? null)
      setDrafts(dList)
      // 将后端消息转换为 ChatMessage 格式
      setChatMessages(toBackendMessages(mList))

      // 确定当前草案
      let cd: WorkflowPlanningDraft | null = null
      if (s?.currentDraftId) {
        cd = await getPlanningDraftById(s.currentDraftId) ?? null
      } else {
        cd = dList[0] ?? null
      }
      setCurrentDraftState(cd)

      // 触发草案校验（局部，不影响消息 state）
      if (cd && s) {
        const v = await validatePlanningDraftById(cd.id, {
          projectTypeId: s.projectTypeId,
          goalTypeId: s.goalTypeId,
          deliverableMode: s.deliverableMode,
        })
        setValidationResult(v)
      } else {
        setValidationResult(null)
      }

      const cfg = await getDefaultModelConfig()
      setDefaultModelConfig(cfg)
      const plannerId = s?.plannerAgentTemplateId ?? 'at-workflow-planner'
      const pt = await getTemplateById(plannerId)
      setPlannerTemplate(pt ?? null)
    } finally {
      setPageLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    initialLoad()
  }, [initialLoad])

  // ── 发消息（核心：乐观更新） ──────────────────────────────────────────────

  /**
   * handleSend
   * 无草案时：先 handlePlannerChat（澄清 or 生成）；有草案时：修订。
   *
   * 乐观更新：追加用户消息 + loading 气泡 → 调用后端 → 刷新消息列表并更新 currentDraft（若生成/修订成功）
   */
  const handleSend = useCallback(
    async (text: string) => {
      if (!id || !session || sending) return
      setSending(true)

      const optimisticMsg = makeOptimisticUserMessage(id, text)
      const loadingMsg = makeLoadingMessage(id)
      setChatMessages((prev) => [...prev, optimisticMsg, loadingMsg])

      try {
        await addPlanningMessage({
          sessionId: id,
          role: 'user',
          content: text,
          messageType: 'chat',
        })

        if (!currentDraft) {
          const result = await handlePlannerChat(id, text)
          const mList = await listPlanningMessages(id)
          setChatMessages(toBackendMessages(mList))
          if (result.phase === 'generating') {
            setCurrentDraftState(result.draft)
            setDrafts((prev) => {
              const has = prev.some((d) => d.id === result.draft.id)
              return has ? prev : [...prev, result.draft]
            })
            setValidationResult(result.validation)
            setPrevDraft(null)
          }
        } else {
          const mList = await listPlanningMessages(id)
          const lastUser = mList.filter((m) => m.role === 'user').pop()
          if (!lastUser) throw new Error('未找到用户消息')
          setPrevDraft(currentDraft)
          const { draft, validation } = await reviseDraftFromUserMessage(id, lastUser.id)
          const mList2 = await listPlanningMessages(id)
          setChatMessages(toBackendMessages(mList2))
          setCurrentDraftState(draft)
          setDrafts((prev) => {
            const has = prev.some((d) => d.id === draft.id)
            return has ? prev.map((d) => (d.id === draft.id ? draft : d)) : [...prev, draft]
          })
          setValidationResult(validation)
        }
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : PLANNING_LLM_ERROR_LABELS.callFailed
        setChatMessages((prev) =>
          prev
            .filter((m) => !m.isLoading)
            .concat({
              id: makeTempId(),
              sessionId: id,
              role: 'system',
              content: errMsg,
              messageType: 'system',
              createdAt: new Date().toISOString(),
              isError: true,
              onRetry: () => handleSend(text),
            } as ChatMessage),
        )
      } finally {
        setSending(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, session, currentDraft, sending],
  )

  /** 节点 Inspector 内切换 Agent：仅更新当前草案内存态 */
  const handleNodeAgentChange = useCallback((nodeId: string, agentId: string | null) => {
    setCurrentDraftState((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        nodes: prev.nodes.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                recommendedAgentTemplateId: agentId ?? undefined,
                bindingStatus: agentId ? 'ready' : 'placeholder',
              }
            : n
        ),
      }
    })
  }, [])

  // ── 版本切换 ───────────────────────────────────────────────────────────────

  /**
   * handleSwitchDraft
   * 切换当前草案版本
   * - 调用 setCurrentDraft(id, draftId)
   * - 更新 session.currentDraftId
   * - 拉取对应草案，更新 currentDraft
   * - 重新触发校验
   */
  const handleSwitchDraft = useCallback(
    async (draftId: string) => {
      if (!id || !session) return
      setActionLoading(true)
      try {
        const updated = await setCurrentDraft(id, draftId)
        if (updated) {
          setSession(updated)
          const cd = await getPlanningDraftById(draftId)
          setCurrentDraftState(cd ?? null)
          if (cd && session) {
            const v = await validatePlanningDraftById(cd.id, {
              projectTypeId: session.projectTypeId,
              goalTypeId: session.goalTypeId,
              deliverableMode: session.deliverableMode,
            })
            setValidationResult(v)
          }
        }
      } finally {
        setActionLoading(false)
      }
    },
    [id, session],
  )

  // ── 新建草案版本 ───────────────────────────────────────────────────────────

  /**
   * handleNewDraft
   * 以当前草案节点为基础新建一个草案版本
   * - 创建草案后调用 initialLoad 刷新（版本切换需要全量刷新）
   * - 写入系统消息"新建草案版本 vN"
   */
  const handleNewDraft = useCallback(async () => {
    if (!id || !session) return
    setActionLoading(true)
    try {
      const baseNodes = currentDraft?.nodes ?? [
        {
          id: 'wpn-new-1',
          key: 'step1',
          name: '步骤 1',
          executionType: 'agent_task' as const,
          intentType: 'create' as const,
          orderIndex: 1,
          dependsOnNodeIds: [],
        },
      ]
      const newNodes = baseNodes.map((n, i) => ({
        ...n,
        id: `wpn-${Date.now()}-${i}`,
        orderIndex: i + 1,
        dependsOnNodeIds: (n.dependsOnNodeIds ?? []) as string[],
      }))
      const created = await createPlanningDraft({
        sessionId: id,
        version: drafts.length + 1,
        summary: `草案 v${drafts.length + 1}`,
        nodes: newNodes,
        status: 'draft',
      })
      await addPlanningMessage({
        sessionId: id,
        role: 'system',
        content: `新建草案版本 v${created.version}`,
        messageType: 'system',
      })
      await initialLoad()
    } finally {
      setActionLoading(false)
    }
  }, [id, session, currentDraft, drafts, initialLoad])

  // ── 发布模板 ───────────────────────────────────────────────────────────────

  /**
   * handleConfirmPublish
   * 将当前草案发布为 WorkflowTemplate
   * 成功后跳转到 Template 详情页
   */
  const handleConfirmPublish = useCallback(
    async (params: {
      templateName: string
      templateDescription: string
      scopeType: 'system' | 'tenant'
      tenantId?: string
    }) => {
      if (!id || !currentDraft) return
      setActionLoading(true)
      try {
        const { template } = await publishDraftAsTemplate({
          draftId: currentDraft.id,
          scopeType: params.scopeType,
          tenantId: params.tenantId,
          templateName: params.templateName,
          templateDescription: params.templateDescription || undefined,
          publishedBy,
        })
        setPublishDialogOpen(false)
        navigate(getTemplateDetailRoute(template.id, template.scopeType))
      } finally {
        setActionLoading(false)
      }
    },
    [id, currentDraft, publishedBy, navigate, getTemplateDetailRoute],
  )

  // ── 草案版本选择器 JSX ─────────────────────────────────────────────────────

  /** 选中的节点 data，供 NodeInspector 展示 */
  const selectedNodeData = useMemo((): WorkflowNodeData | null => {
    if (!selectedNodeId || !currentDraft) return null
    const n = currentDraft.nodes.find((x) => x.id === selectedNodeId)
    if (!n) return null
    return {
      nodeId: n.id,
      key: n.key,
      label: n.name,
      executionType: n.executionType,
      intentType: n.intentType,
      payload: n as unknown as Record<string, unknown>,
    }
  }, [selectedNodeId, currentDraft])

  // ── 渲染 ────────────────────────────────────────────────────────────────────

  if (!id) return null
  if (pageLoading || !session) {
    return (
      <PageContainer title="流程规划工作台" description="加载中...">
        <p>加载中...</p>
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title={session.title}
      description={`${scopeLabel} · ${PLANNING_SESSION_STATUS_LABELS[session.status]}`}
    >
      {/* 返回条 */}
      <div className={styles.headerBar}>
        <Link to={listRoute} className={styles.backLink}>
          ← 返回列表
        </Link>
        {/* 发布按钮（右侧对齐） */}
        <button
          type="button"
          className={listPageStyles.primaryBtn}
          onClick={() => setPublishDialogOpen(true)}
          disabled={actionLoading || !currentDraft || !validationResult?.isValid}
        >
          确认发布为流程模板
        </button>
      </div>

      {/* 可折叠规划上下文条 */}
      <WorkbenchContextBar
        session={session}
        plannerTemplate={plannerTemplate}
        collapsed={contextBarCollapsed}
        onToggle={() => setContextBarCollapsed((c) => !c)}
        labels={{
          plannerDomain: (d) => PLANNER_DOMAIN_LABELS[d] ?? d,
          projectType: (id) => PLANNING_PROJECT_TYPE_LABELS[id] ?? id,
          goalType: (id) => PLANNING_GOAL_TYPE_LABELS[id] ?? id,
          deliverable: (m) => PLANNING_DELIVERABLE_LABELS[m] ?? m,
          sourceType: (t) => PLANNING_SOURCE_TYPE_LABELS[t as PlanningSourceType] ?? t,
        }}
      />

      {/* 三栏主体：左对话 | 中文字摘要 | 右画布+Inspector */}
      <div className={styles.threeColumn}>
        <section className={styles.chatColumn}>
          <PlannerChatPanel
            messages={chatMessages}
            hasDraft={!!currentDraft}
            sending={sending}
            onSend={handleSend}
            contextSummary={null}
            validationResult={validationResult}
            changeSummary={currentDraft?.changeSummary}
            riskNotes={currentDraft?.riskNotes}
          />
        </section>

        <DraftTextSummaryPanel
          draft={currentDraft}
          drafts={drafts}
          currentDraftId={session?.currentDraftId}
          actionLoading={actionLoading}
          selectedNodeId={selectedNodeId}
          onSwitchDraft={handleSwitchDraft}
          onNewDraft={handleNewDraft}
          onSelectNodeId={setSelectedNodeId}
        />

        <section className={styles.canvasColumn}>
          {!currentDraft ? (
            <div className={styles.canvasWrap} style={{ alignItems: 'center', justifyContent: 'center', color: '#999' }}>
              暂无草案。发送消息后，流程规划助手将生成流程图。
            </div>
          ) : (
            <>
              <div className={styles.canvasWrap}>
                <WorkflowGraphEditor
                  nodes={currentDraft.nodes as Array<{ id: string; key: string; name: string; orderIndex: number; dependsOnNodeIds: string[]; executionType: string; intentType?: string; [k: string]: unknown }>}
                  mode="planning"
                  readOnly
                  topSlot={null}
                  selectedNodeId={selectedNodeId}
                  onSelectionChange={setSelectedNodeId}
                  style={{ height: 400, minHeight: 400 }}
                />
              </div>
              {currentDraft.missingCapabilities && currentDraft.missingCapabilities.length > 0 && (
                <div className={styles.missingCapabilitiesBadge}>
                  当前流程缺少 {currentDraft.missingCapabilities.length} 项能力，可前往 Agent 工厂补充后重新规划。
                </div>
              )}
              {selectedNodeData && (
                <div className={styles.inspectorWrap}>
                  <NodeInspector
                    nodeData={selectedNodeData}
                    readOnly={false}
                    onAgentChange={handleNodeAgentChange}
                  />
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* 发布弹窗 */}
      <PublishTemplateDialog
        open={publishDialogOpen}
        onClose={() => setPublishDialogOpen(false)}
        onConfirm={handleConfirmPublish}
        allowSystemPublish={allowSystemPublish}
        defaultTenantId={tenantId}
        loading={actionLoading}
      />
    </PageContainer>
  )
}
