/**
 * 流程运行中心详情页（Phase 13）
 * 布局：左侧节点时间线、中间节点详情、右侧运行日志
 */
import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import { getRuntimeDetail, retryNode, pauseWorkflow, continueWorkflow, approveReview } from '@/modules/tenant/services/workflowRuntimeService'
import {
  listSupervisorDecisions,
  analyzeWorkflowInstance,
  applySupervisorDecision,
  dismissSupervisorDecision,
} from '@/modules/tenant/services/workflowSupervisorService'
import { switchToFallbackAgent, switchToFallbackSkill } from '@/modules/tenant/services/workflowSupervisorRecoveryService'
import { executeWorkerNode } from '@/modules/tenant/services/workerAgentExecutionService'
import { executeNode } from '@/modules/tenant/services/workflowNodeExecutionService'
import type { WorkflowSupervisorDecision } from '@/modules/tenant/schemas/workflowExecution'
import type { WorkflowRuntimeDetailView } from '@/modules/tenant/services/workflowRuntimeService'
import type { WorkflowInstanceNode } from '@/modules/tenant/schemas/workflowExecution'
import {
  WORKFLOW_INSTANCE_STATUS_LABELS,
  WORKFLOW_INSTANCE_NODE_STATUS_LABELS,
  RUNTIME_LOG_EVENT_TYPE_LABELS,
  NODE_TYPE_LABELS,
  EXECUTOR_TYPE_LABELS,
  EXECUTION_TYPE_LABELS,
  INTENT_TYPE_LABELS,
  SUPERVISOR_DECISION_TYPE_LABELS,
  SUPERVISOR_DECISION_STATUS_LABELS,
  RETRY_STRATEGY_LABELS,
  RECOVERY_STATUS_LABELS,
} from '@/core/labels/workflowRuntimeLabels'
import { ROUTES } from '@/core/constants/routes'
import styles from './WorkflowRuntimeDetail.module.css'

const statusMap: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  success: 'success',
  running: 'success',
  waiting_review: 'warning',
  failed: 'error',
  pending: 'neutral',
  skipped: 'neutral',
  draft: 'neutral',
}

interface WorkflowRuntimeDetailProps {
  mode: 'platform' | 'tenant'
}

export function WorkflowRuntimeDetail({ mode }: WorkflowRuntimeDetailProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<WorkflowRuntimeDetailView | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [supervisorDecisions, setSupervisorDecisions] = useState<WorkflowSupervisorDecision[]>([])
  const [supervisorLoading, setSupervisorLoading] = useState(false)

  const listPath = mode === 'platform' ? ROUTES.SYSTEM.WORKFLOW_RUNTIME : ROUTES.TENANT.WORKFLOW_RUNTIME

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const d = await getRuntimeDetail(id)
      setDetail(d)
      if (d?.nodes.length && !selectedNodeId) setSelectedNodeId(d.nodes[0].id)
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- load only when instance id changes
  }, [id])

  const loadSupervisor = useCallback(async () => {
    if (!id) return
    const list = await listSupervisorDecisions(id)
    setSupervisorDecisions(list)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    loadSupervisor()
  }, [loadSupervisor])

  useEffect(() => {
    if (detail?.nodes.length && !selectedNodeId) setSelectedNodeId(detail.nodes[0].id)
  }, [detail?.nodes, selectedNodeId])

  const selectedNode = detail?.nodes.find((n) => n.id === selectedNodeId) ?? null

  const handleRetry = async () => {
    if (!id || !selectedNodeId) return
    setActionLoading(true)
    setActionError(null)
    try {
      await retryNode(id, selectedNodeId)
      await load()
    } catch (e) {
      setActionError((e as Error).message)
    } finally {
      setActionLoading(false)
    }
  }

  const handlePause = async () => {
    if (!id) return
    setActionLoading(true)
    setActionError(null)
    try {
      await pauseWorkflow(id)
      await load()
    } catch (e) {
      setActionError((e as Error).message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleContinue = async () => {
    if (!id) return
    setActionLoading(true)
    setActionError(null)
    try {
      await continueWorkflow(id)
      await load()
    } catch (e) {
      setActionError((e as Error).message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!id || !selectedNodeId) return
    setActionLoading(true)
    setActionError(null)
    try {
      await approveReview(id, selectedNodeId)
      await load()
    } catch (e) {
      setActionError((e as Error).message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleApplyDecision = async (decisionId: string) => {
    setActionLoading(true)
    setActionError(null)
    try {
      await applySupervisorDecision(decisionId)
      await load()
      await loadSupervisor()
    } catch (e) {
      setActionError((e as Error).message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDismissDecision = async (decisionId: string) => {
    setActionLoading(true)
    setActionError(null)
    try {
      await dismissSupervisorDecision(decisionId)
      await loadSupervisor()
    } catch (e) {
      setActionError((e as Error).message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReanalyze = async () => {
    if (!id) return
    setSupervisorLoading(true)
    setActionError(null)
    try {
      await analyzeWorkflowInstance(id)
      await loadSupervisor()
    } catch (e) {
      setActionError((e as Error).message)
    } finally {
      setSupervisorLoading(false)
    }
  }

  const handleSwitchFallbackAgent = async (nodeId: string) => {
    if (!id) return
    setActionLoading(true)
    setActionError(null)
    try {
      await switchToFallbackAgent(id, nodeId)
      await load()
      await loadSupervisor()
    } catch (e) {
      setActionError((e as Error).message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleExecuteWorker = async (nodeId: string) => {
    if (!id) return
    setActionLoading(true)
    setActionError(null)
    try {
      const result = await executeWorkerNode(id, nodeId)
      if (!result.success) {
        setActionError(result.errorMessageZh ?? result.errorMessage ?? '执行失败')
      }
      await load()
      await loadSupervisor()
    } catch (e) {
      setActionError((e as Error).message)
    } finally {
      setActionLoading(false)
    }
  }

  /** 服务端执行节点（P1-A：pending/failed 节点触发执行） */
  const handleExecuteNode = async (nodeId: string) => {
    if (!id) return
    setActionLoading(true)
    setActionError(null)
    try {
      await executeNode(id, nodeId)
      await load()
      await loadSupervisor()
    } catch (e) {
      setActionError((e as Error).message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSwitchFallbackSkill = async (nodeId: string) => {
    if (!id) return
    setActionLoading(true)
    setActionError(null)
    try {
      await switchToFallbackSkill(id, nodeId)
      await load()
      await loadSupervisor()
    } catch (e) {
      setActionError((e as Error).message)
    } finally {
      setActionLoading(false)
    }
  }

  if (!id) {
    return (
      <PageContainer title="流程运行详情">
        <p>缺少实例 ID</p>
        <button type="button" onClick={() => navigate(listPath)}>
          返回列表
        </button>
      </PageContainer>
    )
  }

  if (loading && !detail) {
    return (
      <PageContainer title="流程运行详情">
        <p>加载中…</p>
      </PageContainer>
    )
  }

  if (!detail) {
    return (
      <PageContainer title="流程运行详情">
        <p>未找到该流程实例</p>
        <button type="button" onClick={() => navigate(listPath)}>
          返回列表
        </button>
      </PageContainer>
    )
  }

  const { instance, instanceName, projectName, templateName, nodes, templateNodes = [], logs, progressText } = detail
  const selectedTemplateNode = selectedNode
    ? templateNodes.find((t) => t.id === selectedNode.templateNodeId || (t.nodeKey ?? t.key) === selectedNode.nodeKey)
    : null
  const canRetry = selectedNode?.status === 'failed'
  const canExecuteNode =
    selectedNode &&
    (selectedNode.status === 'pending' || selectedNode.status === 'failed')
  const canExecuteWorker =
    selectedNode?.status === 'running' &&
    selectedTemplateNode &&
    ['at-base-content-creator', 'at-facebook-content-creator', 'at-content-reviewer'].includes(
      selectedNode.selectedAgentTemplateId ??
        selectedTemplateNode.recommendedAgentTemplateId ??
        (selectedTemplateNode as { agentTemplateId?: string }).agentTemplateId ??
        ''
    )
  const canPause = instance.status === 'running'
  const canContinue = instance.status === 'running' || instance.status === 'waiting_review'
  const canApprove = selectedNode?.status === 'waiting_review'
  const hasRecoveryActivity =
    nodes.some((n) => (n.retryCount ?? 0) > 0 || n.recoveryStatus || n.lastRecoveryAction) ||
    logs.some((l) =>
      ['node_retry_started', 'node_retry_completed', 'fallback_agent_used', 'fallback_skill_used', 'restart_previous_node'].includes(l.eventType)
    )

  return (
    <PageContainer title="流程运行详情" description={instanceName}>
      {hasRecoveryActivity && (
        <div className={styles.recoverySummary}>
          <strong>恢复状态摘要：</strong>
          {nodes.some((n) => (n.retryCount ?? 0) > 0) && (
            <span> 当前流程已自动/手动重试 {Math.max(...nodes.map((n) => n.retryCount ?? 0))} 次 </span>
          )}
          {nodes.some((n) => n.recoveryStatus === 'fallback_agent') && <span> 当前节点已切换备用 Agent </span>}
          {nodes.some((n) => n.recoveryStatus === 'fallback_skill') && <span> 当前节点已切换备用 Skill </span>}
          {instance.status === 'waiting_review' && <span> 当前流程等待人工处理 </span>}
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.headerMeta}>
          <span>项目：{projectName}</span>
          <span>模板：{templateName}</span>
          <span>状态：<StatusTag type={statusMap[instance.status] ?? 'neutral'}>{WORKFLOW_INSTANCE_STATUS_LABELS[instance.status]}</StatusTag></span>
          <span>当前节点：{instance.currentNodeKey ?? '—'}</span>
          <span>完成进度：{progressText}</span>
          <span>创建时间：{instance.createdAt}</span>
          <span>更新时间：{instance.updatedAt}</span>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={listPageStyles.linkBtn} onClick={() => navigate(listPath)}>
            返回列表
          </button>
        </div>
      </div>

      {actionError && <div className={styles.error}>{actionError}</div>}

      <div className={styles.layout}>
        <div className={styles.left}>
          <Card title="节点时间线" description="流程节点执行顺序">
            <ul className={styles.nodeTimeline}>
              {nodes.map((n) => (
                <li
                  key={n.id}
                  className={`${styles.nodeItem} ${selectedNodeId === n.id ? styles.nodeItemActive : ''}`}
                  onClick={() => setSelectedNodeId(n.id)}
                >
                  <span className={styles.nodeStatus}>{WORKFLOW_INSTANCE_NODE_STATUS_LABELS[n.status]}</span>
                  <span className={styles.nodeName}>{n.nodeName ?? n.name ?? n.nodeKey}</span>
                  <span className={styles.nodeType}>
                    {n.executionType ? EXECUTION_TYPE_LABELS[n.executionType] : n.nodeType ? NODE_TYPE_LABELS[n.nodeType] : n.executorType ? EXECUTOR_TYPE_LABELS[n.executorType] : '—'}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className={styles.center}>
          <Card title="节点详情" description={selectedNode ? (selectedNode.nodeName ?? selectedNode.name ?? selectedNode.nodeKey) : '选择节点'}>
            {selectedNode ? (
              <>
                <NodeDetailCard node={selectedNode} templateNode={selectedTemplateNode} />
                {(selectedNode.workerOutputJson ||
                  selectedNode.workerExecutionModel ||
                  selectedNode.workerExecutionDurationMs) && (
                  <WorkerExecutionBlock node={selectedNode} />
                )}
                {selectedTemplateNode && (
                  <RecoveryPolicyBlock templateNode={selectedTemplateNode} instanceNode={selectedNode} />
                )}
              </>
            ) : (
              <p className={styles.placeholder}>请在左侧选择节点</p>
            )}
            {(canRetry || canExecuteNode || canPause || canContinue || canApprove || canExecuteWorker || (selectedNode?.status === 'failed' && selectedTemplateNode?.fallbackAgentTemplateIds?.length)) && (
              <div className={styles.manualActions}>
                {canExecuteNode && selectedNodeId && (
                  <button type="button" className={listPageStyles.primaryBtn} disabled={actionLoading} onClick={() => handleExecuteNode(selectedNodeId)}>
                    执行此节点
                  </button>
                )}
                {canExecuteWorker && selectedNodeId && (
                  <button
                    type="button"
                    className={listPageStyles.primaryBtn}
                    disabled={actionLoading}
                    onClick={() => handleExecuteWorker(selectedNodeId)}
                  >
                    执行 Worker AI
                  </button>
                )}
                {canRetry && (
                  <button type="button" className={listPageStyles.primaryBtn} disabled={actionLoading} onClick={handleRetry}>
                    手动重试
                  </button>
                )}
                {selectedNode?.status === 'failed' &&
                  selectedTemplateNode?.fallbackAgentTemplateIds?.length &&
                  selectedNodeId && (
                    <button
                      type="button"
                      className={listPageStyles.queryBtn}
                      disabled={actionLoading}
                      onClick={() => handleSwitchFallbackAgent(selectedNodeId)}
                    >
                      手动切换备用 Agent
                    </button>
                  )}
                {selectedNode?.status === 'failed' &&
                  selectedTemplateNode?.fallbackSkillIds?.length &&
                  selectedNodeId && (
                    <button
                      type="button"
                      className={listPageStyles.queryBtn}
                      disabled={actionLoading}
                      onClick={() => handleSwitchFallbackSkill(selectedNodeId)}
                    >
                      手动切换备用 Skill
                    </button>
                  )}
                {canPause && (
                  <button type="button" className={listPageStyles.queryBtn} disabled={actionLoading} onClick={handlePause}>
                    暂停流程
                  </button>
                )}
                {canContinue && (
                  <button type="button" className={listPageStyles.queryBtn} disabled={actionLoading} onClick={handleContinue}>
                    继续执行
                  </button>
                )}
                {canApprove && (
                  <button type="button" className={listPageStyles.primaryBtn} disabled={actionLoading} onClick={handleApprove}>
                    标记审核通过
                  </button>
                )}
              </div>
            )}
          </Card>
        </div>

        <div className={styles.right}>
          <Card title="运行日志" description="执行事件记录">
            <ul className={styles.logList}>
              {logs.length === 0 ? (
                <li className={styles.logEmpty}>暂无日志</li>
              ) : (
                logs.map((log) => (
                  <li key={log.id} className={styles.logItem}>
                    <span className={styles.logTime}>{log.createdAt}</span>
                    <span className={styles.logType}>{(RUNTIME_LOG_EVENT_TYPE_LABELS as Record<string, string>)[log.eventType] ?? log.eventType}</span>
                    <span className={styles.logMsg}>{(log as { messageZh?: string; message?: string }).messageZh ?? (log as { message?: string }).message ?? '—'}</span>
                  </li>
                ))
              )}
            </ul>
          </Card>
        </div>
      </div>

      <div className={styles.supervisorPanel}>
        <Card
          title="监督与恢复建议"
          description="执行监督助手基于节点策略生成的恢复建议，需人工确认后应用"
        >
          <div className={styles.supervisorActions}>
            <button
              type="button"
              className={listPageStyles.queryBtn}
              disabled={supervisorLoading}
              onClick={handleReanalyze}
            >
              重新分析
            </button>
          </div>
          {supervisorDecisions.length === 0 ? (
            <p className={styles.supervisorEmpty}>暂无监督建议。点击「重新分析」获取基于节点恢复策略的执行监督建议。</p>
          ) : (
            <ul className={styles.supervisorList}>
              {supervisorDecisions.map((d) => (
                <li key={d.id} className={styles.supervisorItem}>
                  <div className={styles.supervisorMeta}>
                    <span className={styles.supervisorType}>
                      {SUPERVISOR_DECISION_TYPE_LABELS[d.decisionType]}
                    </span>
                    <StatusTag type={d.status === 'suggested' ? 'warning' : d.status === 'applied' ? 'success' : 'neutral'}>
                      {SUPERVISOR_DECISION_STATUS_LABELS[d.status]}
                    </StatusTag>
                  </div>
                  <div className={styles.supervisorKv}>
                    <span>原因说明</span>
                    <span>{d.reasonZh}</span>
                  </div>
                  <div className={styles.supervisorKv}>
                    <span>建议下一步</span>
                    <span>{d.suggestedNextAction}</span>
                  </div>
                  {d.relatedErrorSummary && (
                    <div className={styles.supervisorKv}>
                      <span>相关错误</span>
                      <span>{d.relatedErrorSummary}</span>
                    </div>
                  )}
                  {d.status === 'suggested' && (
                    <div className={styles.supervisorButtons}>
                      <button
                        type="button"
                        className={listPageStyles.primaryBtn}
                        disabled={actionLoading}
                        onClick={() => handleApplyDecision(d.id)}
                      >
                        应用建议
                      </button>
                      <button
                        type="button"
                        className={listPageStyles.linkBtn}
                        disabled={actionLoading}
                        onClick={() => handleDismissDecision(d.id)}
                      >
                        忽略建议
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PageContainer>
  )
}

function NodeDetailCard({
  node,
  templateNode: _templateNode,
}: {
  node: WorkflowInstanceNode
  templateNode?: { id: string; nodeKey?: string; key?: string } | null
}) {
  const typeLabel = node.executionType
    ? EXECUTION_TYPE_LABELS[node.executionType]
    : node.nodeType
      ? NODE_TYPE_LABELS[node.nodeType]
      : node.executorType
        ? EXECUTOR_TYPE_LABELS[node.executorType]
        : '—'
  const intentLabel = node.intentType ? INTENT_TYPE_LABELS[node.intentType] : '—'
  return (
    <div className={styles.nodeDetail}>
      <div className={styles.kv}>
        <span>节点名称</span>
        <span>{node.nodeName ?? node.name ?? node.nodeKey}</span>
      </div>
      <div className={styles.kv}>
        <span>类型</span>
        <span>{typeLabel}</span>
      </div>
      {node.intentType && (
        <div className={styles.kv}>
          <span>意图</span>
          <span>{intentLabel}</span>
        </div>
      )}
      <div className={styles.kv}>
        <span>状态</span>
        <span>
          <StatusTag type={statusMap[node.status] ?? 'neutral'}>
            {WORKFLOW_INSTANCE_NODE_STATUS_LABELS[node.status]}
          </StatusTag>
        </span>
      </div>
      <div className={styles.kv}>
        <span>开始时间</span>
        <span>{node.startedAt ?? '—'}</span>
      </div>
      <div className={styles.kv}>
        <span>结束时间</span>
        <span>{node.finishedAt ?? node.completedAt ?? '—'}</span>
      </div>
      <div className={styles.kv}>
        <span>执行摘要</span>
        <span>{node.resultSummary ?? node.executionSummary ?? '—'}</span>
      </div>
      <div className={styles.kv}>
        <span>错误摘要</span>
        <span>{node.errorSummary ?? node.lastErrorSummary ?? '—'}</span>
      </div>
      {(node.retryCount !== undefined && node.retryCount > 0) && (
        <div className={styles.kv}>
          <span>已重试次数</span>
          <span>{node.retryCount}</span>
        </div>
      )}
      {node.recoveryStatus && (
        <div className={styles.kv}>
          <span>恢复状态</span>
          <span>{RECOVERY_STATUS_LABELS[node.recoveryStatus] ?? node.recoveryStatus}</span>
        </div>
      )}
      <div className={styles.kv}>
        <span>审核摘要</span>
        <span>{node.reviewSummary ?? '—'}</span>
      </div>
    </div>
  )
}

function WorkerExecutionBlock({ node }: { node: WorkflowInstanceNode }) {
  const output = node.workerOutputJson
  const isCreator = output && 'content' in output
  const isReviewer = output && 'reviewResult' in output

  return (
    <div className={styles.recoveryPolicy}>
      <div className={styles.recoveryPolicyTitle}>AI 执行信息</div>
      <div className={styles.nodeDetail}>
        {node.workerExecutionAgentId && (
          <div className={styles.kv}>
            <span>执行 Agent</span>
            <span>{node.workerExecutionAgentId}</span>
          </div>
        )}
        {node.workerExecutionModel && (
          <div className={styles.kv}>
            <span>执行模型</span>
            <span>{node.workerExecutionModel}</span>
          </div>
        )}
        {node.workerExecutionDurationMs !== undefined && (
          <div className={styles.kv}>
            <span>执行耗时</span>
            <span>{node.workerExecutionDurationMs}ms</span>
          </div>
        )}
      </div>
      {isCreator && output && (
        <>
          <div className={styles.recoveryPolicyTitle}>内容生成结果</div>
          <div className={styles.nodeDetail}>
            <div className={styles.kv}>
              <span>生成内容</span>
              <span className={styles.workerContent}>
                {(output as { content?: string }).content ?? '—'}
              </span>
            </div>
            <div className={styles.kv}>
              <span>摘要</span>
              <span>{(output as { summary?: string } | undefined)?.summary ?? '—'}</span>
            </div>
            <div className={styles.kv}>
              <span>标签</span>
              <span>
                {Array.isArray((output as { tags?: string[] })?.tags)
                  ? (output as { tags?: string[] })?.tags?.join('、') ?? '—'
                  : '—'}
              </span>
            </div>
            <div className={styles.kv}>
              <span>备注</span>
              <span>{(output as { notes?: string })?.notes ?? '—'}</span>
            </div>
          </div>
        </>
      )}
      {isReviewer && output && (
        <>
          <div className={styles.recoveryPolicyTitle}>审核结果</div>
          <div className={styles.nodeDetail}>
            <div className={styles.kv}>
              <span>审核结论</span>
              <span>
                {(output as { reviewResult?: string }).reviewResult === 'approved'
                  ? '通过'
                  : '需修订'}
              </span>
            </div>
            <div className={styles.kv}>
              <span>问题列表</span>
              <span>
                {Array.isArray((output as { issues?: string[] })?.issues)
                  ? (output as { issues?: string[] })?.issues?.join('；') || '无'
                  : '—'}
              </span>
            </div>
            <div className={styles.kv}>
              <span>修改建议</span>
              <span>
                {Array.isArray((output as { suggestions?: string[] })?.suggestions)
                  ? (output as { suggestions?: string[] })?.suggestions?.join('；') || '无'
                  : '—'}
              </span>
            </div>
            <div className={styles.kv}>
              <span>审核摘要</span>
              <span>{(output as { summary?: string } | undefined)?.summary ?? '—'}</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function RecoveryPolicyBlock({
  templateNode,
  instanceNode,
}: {
  templateNode: import('@/modules/tenant/schemas/workflowExecution').WorkflowTemplateNode
  instanceNode: WorkflowInstanceNode
}) {
  const rp = templateNode.retryPolicy
  const fa = templateNode.fallbackAgentTemplateIds ?? []
  const fs = templateNode.fallbackSkillIds ?? []
  const sp = templateNode.supervisorPolicy
  if (!rp && fa.length === 0 && fs.length === 0 && !sp) return null

  return (
    <div className={styles.recoveryPolicy}>
      <div className={styles.recoveryPolicyTitle}>恢复策略</div>
      <div className={styles.nodeDetail}>
        {rp && (
          <>
            <div className={styles.kv}>
              <span>重试策略</span>
              <span>{rp.enabled ? '允许' : '不允许'}</span>
            </div>
            <div className={styles.kv}>
              <span>最大重试次数</span>
              <span>{rp.maxRetryCount}</span>
            </div>
            <div className={styles.kv}>
              <span>当前已重试</span>
              <span>{instanceNode.retryCount ?? 0}</span>
            </div>
            <div className={styles.kv}>
              <span>重试方式</span>
              <span>{RETRY_STRATEGY_LABELS[rp.retryStrategy] ?? rp.retryStrategy}</span>
            </div>
            <div className={styles.kv}>
              <span>允许自动重试</span>
              <span>{rp.autoRetryEnabled ? '是' : '否'}</span>
            </div>
          </>
        )}
        {fa.length > 0 && (
          <div className={styles.kv}>
            <span>备用 Agent</span>
            <span>{fa.join('、')}</span>
          </div>
        )}
        {fs.length > 0 && (
          <div className={styles.kv}>
            <span>备用 Skill</span>
            <span>{fs.join('、')}</span>
          </div>
        )}
        {sp && (
          <>
            <div className={styles.kv}>
              <span>允许跳过</span>
              <span>{sp.allowSkip ? '是' : '否'}</span>
            </div>
            <div className={styles.kv}>
              <span>允许回退上一节点</span>
              <span>{sp.allowRestartPreviousNode ? '是' : '否'}</span>
            </div>
            <div className={styles.kv}>
              <span>允许人工审核</span>
              <span>{sp.allowManualReview ? '是' : '否'}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
