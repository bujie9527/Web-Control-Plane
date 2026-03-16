import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { ROUTES } from '@/core/constants/routes'
import {
  getTaskExecutionView,
  completeTaskOrInstance,
  advanceReview,
  runMockExecutionFlow,
  type TaskExecutionView as TaskExecutionViewType,
} from '../services/workflowExecutionService'
import type { WorkflowInstanceStatus, WorkflowInstanceNodeStatus } from '../schemas/workflowExecution'
import styles from './TaskExecutionPage.module.css'

const instanceStatusMap: Record<WorkflowInstanceStatus, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  draft: 'neutral',
  pending: 'neutral',
  running: 'info',
  waiting_review: 'warning',
  success: 'success',
  failed: 'error',
  canceled: 'neutral',
}
const instanceStatusLabel: Record<WorkflowInstanceStatus, string> = {
  draft: '草稿',
  pending: '待运行',
  running: '运行中',
  waiting_review: '待审核',
  success: '成功',
  failed: '失败',
  canceled: '已取消',
}

const nodeStatusMap: Record<WorkflowInstanceNodeStatus, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  pending: 'neutral',
  running: 'info',
  waiting_review: 'warning',
  completed: 'success',
  failed: 'error',
  skipped: 'neutral',
}
const nodeStatusLabel: Record<WorkflowInstanceNodeStatus, string> = {
  pending: '待执行',
  running: '执行中',
  waiting_review: '待审核',
  completed: '已完成',
  failed: '失败',
  skipped: '已跳过',
}

const nodeTypeLabel: Record<string, string> = {
  manual: '人工',
  agent: 'Agent',
  review: '审核',
  system: '系统',
  other: '其他',
}
const executorTypeLabel: Record<string, string> = {
  human: '人工',
  agent: 'Agent',
  system: '系统',
  api: 'API',
}

export function TaskExecutionPage() {
  const { id: projectId, taskId } = useParams<{ id: string; taskId: string }>()
  const navigate = useNavigate()
  const [view, setView] = useState<TaskExecutionViewType | null | undefined>(undefined)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!projectId || !taskId) return
    getTaskExecutionView(projectId, taskId).then(setView)
  }, [projectId, taskId])

  const refresh = () => {
    if (!projectId || !taskId) return
    setView(undefined)
    getTaskExecutionView(projectId, taskId).then(setView)
  }

  const handleComplete = async () => {
    if (!projectId || !taskId || !view) return
    setActionLoading(true)
    try {
      await completeTaskOrInstance(projectId, taskId)
      refresh()
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReview = async (approved: boolean) => {
    if (!projectId || !taskId || !view) return
    setActionLoading(true)
    try {
      await advanceReview(projectId, taskId, approved)
      refresh()
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRunMockFlow = async () => {
    if (!projectId || !taskId || !view) return
    setActionLoading(true)
    try {
      await runMockExecutionFlow(projectId, taskId)
      refresh()
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(false)
    }
  }

  if (!projectId || !taskId) {
    navigate(ROUTES.TENANT.PROJECTS)
    return null
  }

  if (view === undefined) {
    return (
      <PageContainer title="任务执行" description="加载中...">
        <p className={styles.loading}>加载中...</p>
      </PageContainer>
    )
  }

  if (view === null) {
    return (
      <PageContainer title="任务执行" description="未找到任务">
        <p className={styles.emptyHint}>未找到该任务或流程实例。</p>
        <Link to={ROUTES.TENANT.PROJECTS} className={styles.backLink}>返回项目列表</Link>
      </PageContainer>
    )
  }

  const { task, instance, template, nodes, templateNodes, projectName } = view
  const currentKey = instance.currentNodeKey
  const currentNode = nodes.find((n) => n.nodeKey === currentKey)
  const isReview = currentNode?.nodeType === 'review' && (currentNode?.status === 'waiting_review' || instance.status === 'waiting_review')
  const canComplete = instance.status === 'running' || instance.status === 'pending'
  const isDone = instance.status === 'success' || instance.status === 'failed' || instance.status === 'canceled'
  const isFacebookWorkflow = template?.id === 'wt-facebook'

  return (
    <PageContainer
      title={task.taskName}
      description={`所属项目：${projectName} · 流程：${template?.name ?? '—'}`}
    >
      <div className={styles.summary}>
        <dl className={styles.dl}>
          <dt>任务名称</dt>
          <dd>{task.taskName}</dd>
          <dt>任务状态</dt>
          <dd>{task.status}</dd>
          <dt>所属项目</dt>
          <dd>
            <Link to={`${ROUTES.TENANT.PROJECTS}/${projectId}`} className={styles.link}>
              {projectName}
            </Link>
          </dd>
          <dt>来源流程模板</dt>
          <dd>
            {template ? (
              <Link
                to={`${ROUTES.TENANT.WORKFLOWS}/templates/${template.id}`}
                className={styles.link}
              >
                {template.name} (v{template.version})
              </Link>
            ) : (
              '—'
            )}
          </dd>
          <dt>流程实例状态</dt>
          <dd>
            <StatusTag type={instanceStatusMap[instance.status]}>
              {instanceStatusLabel[instance.status]}
            </StatusTag>
          </dd>
          <dt>当前节点</dt>
          <dd>{currentNode?.nodeName ?? currentKey ?? '—'}</dd>
        </dl>
      </div>

      <Card title="流程实例状态" description="当前执行状态">
        <div className={styles.kvGrid}>
          <span className={styles.kvLabel}>状态</span>
          <span>
            <StatusTag type={instanceStatusMap[instance.status]}>
              {instanceStatusLabel[instance.status]}
            </StatusTag>
          </span>
          <span className={styles.kvLabel}>当前节点</span>
          <span>{currentNode?.nodeName ?? currentKey ?? '—'}</span>
          <span className={styles.kvLabel}>来源</span>
          <span>{instance.sourceSummary ?? '—'}</span>
        </div>
      </Card>

      <Card title="节点时间线" description="按流程顺序展示各节点状态">
        {nodes.length === 0 ? (
          <p className={styles.emptyHint}>暂无节点数据</p>
        ) : (
          <ul className={styles.timeline}>
            {nodes.map((node) => {
              const isCurrent = node.nodeKey === currentKey
              const tNode = templateNodes.find((t) => t.nodeKey === node.nodeKey)
              const agentTemplateName = tNode?.templateSnapshot?.name ?? tNode?.agentTemplateId
              return (
                <li
                  key={node.id}
                  className={`${styles.timelineItem} ${isCurrent ? styles.timelineItemCurrent : ''}`}
                >
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineHeader}>
                      <span className={styles.timelineName}>{node.nodeName}</span>
                      <StatusTag type={nodeStatusMap[node.status]}>
                        {nodeStatusLabel[node.status]}
                      </StatusTag>
                    </div>
                    <div className={styles.timelineMeta}>
                      {nodeTypeLabel[node.nodeType] ?? node.nodeType} ·{' '}
                      {executorTypeLabel[node.executorType] ?? node.executorType}
                      {agentTemplateName && (
                        <span className={styles.templateBadge}> · 模板：{agentTemplateName}</span>
                      )}
                      {node.startedAt && ` · 开始 ${node.startedAt}`}
                      {node.finishedAt && ` · 结束 ${node.finishedAt}`}
                    </div>
                    {node.resultSummary && (
                      <p className={styles.timelineResult}>{node.resultSummary}</p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Card title="本任务使用的身份" description="任务以此身份执行">
        {task.identitySummary ? (
          <div className={styles.identityBlock}>
            <div className={styles.kvGrid}>
              <span className={styles.kvLabel}>身份名称</span>
              <span>{task.identitySummary.name}</span>
              <span className={styles.kvLabel}>身份类型</span>
              <span>{task.identitySummary.type}</span>
            </div>
            <p className={styles.corePositioning}>{task.identitySummary.corePositioningSummary}</p>
            {task.identityId && (
              <Link
                to={`${ROUTES.TENANT.IDENTITIES}/${task.identityId}`}
                className={styles.link}
              >
                查看身份详情
              </Link>
            )}
          </div>
        ) : (
          <p className={styles.emptyHint}>未指定身份</p>
        )}
      </Card>

      <Card title="结果摘要" description="当前节点或流程执行结果">
        {currentNode?.resultSummary ? (
          <p className={styles.resultSummary}>{currentNode.resultSummary}</p>
        ) : isDone ? (
          <p className={styles.emptyHint}>
            {instance.status === 'success' ? '执行已完成。' : instance.status === 'failed' ? '执行失败。' : '已取消。'}
          </p>
        ) : (
          <p className={styles.emptyHint}>暂无结果</p>
        )}
      </Card>

      {!isDone && (
        <Card title="操作" description="审核或完成">
          {isReview && (
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => handleReview(true)}
                disabled={actionLoading}
              >
                {actionLoading ? '处理中…' : '通过'}
              </button>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => handleReview(false)}
                disabled={actionLoading}
              >
                驳回
              </button>
            </div>
          )}
          {canComplete && !isReview && (
            <div className={styles.actions}>
              {isFacebookWorkflow && (
                <>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={handleRunMockFlow}
                    disabled={actionLoading}
                  >
                    {actionLoading ? '执行中…' : '运行闭环演示'}
                  </button>
                  <p className={styles.actionHint}>
                    运行 WorkflowNode → AgentTemplate → Skill → Mock Executor → Result 调度闭环，演示完整执行流程。
                  </p>
                </>
              )}
              {!isFacebookWorkflow && (
                <>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={handleComplete}
                    disabled={actionLoading}
                  >
                    {actionLoading ? '处理中…' : '标记完成'}
                  </button>
                  <p className={styles.actionHint}>标记完成后将回写一条结果到项目结果反馈。</p>
                </>
              )}
            </div>
          )}
        </Card>
      )}

      <p className={styles.backLinkWrap}>
        <Link to={`${ROUTES.TENANT.PROJECTS}/${projectId}`} className={styles.backLink}>
          ← 返回项目详情
        </Link>
      </p>
    </PageContainer>
  )
}
