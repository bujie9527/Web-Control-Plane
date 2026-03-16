import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/Card/Card'
import { Table } from '@/components/Table/Table'
import { Drawer } from '@/components/Drawer/Drawer'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import type { ProjectDetailData, TaskDetailView, TaskItem } from '../../../schemas/projectDetail'
import type { WorkflowTemplate } from '../../../schemas/workflowExecution'
import { fetchTaskDetail } from '../../../services/projectDetailService'
import {
  getTemplates,
  createWorkflowInstanceAndTask,
} from '../../../services/workflowExecutionService'
import { ROUTES } from '@/core/constants/routes'
import styles from '../tabs.module.css'

const workflowColumns = [
  { key: 'name', title: '流程名称', width: '160px' },
  { key: 'version', title: '版本', width: '80px' },
  { key: 'status', title: '状态', width: '90px', render: (_: unknown, r: { status: string }) => <StatusTag type="success">{r.status}</StatusTag> },
  { key: 'lastRunAt', title: '最近运行', width: '140px' },
]

export function WorkflowTasksTab({
  data,
  projectId,
  onRefresh,
}: {
  data: ProjectDetailData
  projectId: string
  onRefresh: () => void
}) {
  const { workflowTasks, identities, summary, projectGoals, projectSOP } = data
  const tenantId = (summary as { tenantId?: string })?.tenantId ?? ''

  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null)
  const [taskDetail, setTaskDetail] = useState<TaskDetailView | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createTemplateId, setCreateTemplateId] = useState('')
  const [createTaskName, setCreateTaskName] = useState('')
  const [createIdentityId, setCreateIdentityId] = useState(identities?.defaultIdentityId ?? identities?.list?.[0]?.identityId ?? '')
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const identityList = identities?.list ?? []
  const defaultId = identities?.defaultIdentityId ?? identityList[0]?.identityId
  const hasGoalOrSOP = (projectGoals && projectGoals.length > 0) || projectSOP != null
  const recommendedTemplates = hasGoalOrSOP ? templates.slice(0, 2) : []

  useEffect(() => {
    if (!tenantId) return
    getTemplates(tenantId).then(setTemplates)
  }, [tenantId])

  useEffect(() => {
    if (createOpen && !createIdentityId && defaultId) setCreateIdentityId(defaultId)
    if (createOpen && !createTemplateId && templates.length > 0) setCreateTemplateId(templates[0].id)
  }, [createOpen, defaultId, createIdentityId, createTemplateId, templates])

  useEffect(() => {
    if (!detailOpen || !detailTaskId || !projectId) {
      setTaskDetail(null)
      return
    }
    setTaskDetail(null)
    fetchTaskDetail(projectId, detailTaskId).then(setTaskDetail)
  }, [detailOpen, detailTaskId, projectId])

  const openDetail = (taskId: string) => {
    setDetailTaskId(taskId)
    setDetailOpen(true)
  }

  const openCreate = (preselectedTemplateId?: string) => {
    setCreateError(null)
    setCreateTaskName('')
    setCreateIdentityId(defaultId ?? '')
    setCreateTemplateId(preselectedTemplateId ?? templates[0]?.id ?? '')
    setCreateOpen(true)
  }

  const handleCreateSubmit = async () => {
    if (!createTemplateId?.trim()) {
      setCreateError('请选择流程模板')
      return
    }
    if (!createIdentityId?.trim()) {
      setCreateError('请选择执行身份')
      return
    }
    if (!createTaskName?.trim()) {
      setCreateError('请输入任务名称')
      return
    }
    setCreateError(null)
    setCreateSubmitting(true)
    try {
      await createWorkflowInstanceAndTask(projectId, {
        projectId,
        templateId: createTemplateId.trim(),
        identityId: createIdentityId,
        taskName: createTaskName.trim(),
        sourceType: 'template',
      })
      setCreateOpen(false)
      setCreateTaskName('')
      setCreateTemplateId('')
      setCreateIdentityId(defaultId ?? '')
      onRefresh()
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : '创建失败')
    } finally {
      setCreateSubmitting(false)
    }
  }

  const taskColumns = [
    { key: 'taskName', title: '任务名称', width: '160px' },
    { key: 'workflowName', title: '流程', width: '120px' },
    { key: 'status', title: '状态', width: '90px' },
    { key: 'assigneeName', title: '负责人', width: '90px' },
    { key: 'identityName', title: '使用身份', width: '120px', render: (_: unknown, r: TaskItem) => r.identityName ?? '—' },
    { key: 'updatedAt', title: '更新时间', width: '140px' },
    {
      key: 'action',
      title: '操作',
      width: '140px',
      render: (_: unknown, r: TaskItem) => (
        <span className={styles.actionGroup}>
          <Link
            to={ROUTES.TENANT.PROJECT_TASK_EXECUTION(projectId, r.id)}
            className={styles.placeholderAction}
          >
            进入执行
          </Link>
          <span className={styles.actionDivider}>|</span>
          <button type="button" className={styles.placeholderAction} onClick={() => openDetail(r.id)}>
            查看
          </button>
        </span>
      ),
    },
  ]

  return (
    <>
      {recommendedTemplates.length > 0 && (
        <Card
          title="根据目标与 SOP 推荐"
          description="根据当前项目目标与 SOP，建议使用以下流程创建任务"
        >
          <ul className={styles.recommendedList}>
            {recommendedTemplates.map((t) => (
              <li key={t.id} className={styles.recommendedItem}>
                <span className={styles.recommendedName}>{t.name}</span>
                <span className={styles.recommendedMeta}>v{t.version} · {t.type}</span>
                <button
                  type="button"
                  className={styles.placeholderBtn}
                  onClick={() => openCreate(t.id)}
                >
                  使用该流程创建
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="当前启用流程" description="本项目使用的流程及版本">
        <Table
          columns={workflowColumns}
          dataSource={workflowTasks.workflows}
          rowKey="id"
          emptyText="暂无流程"
        />
      </Card>

      <Card title="近期任务" description="最近执行或更新的任务，可查看本任务使用的身份与流程">
        <div className={styles.toolbar}>
          <button type="button" className={styles.primaryBtn} onClick={() => openCreate()}>
            创建任务
          </button>
        </div>
        <Table
          columns={taskColumns}
          dataSource={workflowTasks.recentTasks}
          rowKey="id"
          emptyText="暂无任务"
        />
      </Card>

      <Card title="任务状态汇总" description="各状态任务数量">
        <div className={styles.kvGrid}>
          <span className={styles.kvLabel}>运行中</span>
          <span>{workflowTasks.taskSummary.running}</span>
          <span className={styles.kvLabel}>待审核</span>
          <span>{workflowTasks.taskSummary.review}</span>
          <span className={styles.kvLabel}>异常</span>
          <span>{workflowTasks.taskSummary.failed}</span>
          <span className={styles.kvLabel}>已完成</span>
          <span>{workflowTasks.taskSummary.done}</span>
        </div>
      </Card>

      <Drawer open={detailOpen} onClose={() => setDetailOpen(false)} title="任务详情" width={520}>
        {taskDetail === undefined ? (
          <p className={styles.emptyHint}>加载中...</p>
        ) : taskDetail === null ? (
          <p className={styles.emptyHint}>未找到该任务</p>
        ) : (
          <div className={styles.dlWrap}>
            <dl className={styles.dl}>
              <dt>任务名称</dt>
              <dd>{taskDetail.taskName}</dd>
              <dt>流程</dt>
              <dd>{taskDetail.workflowName}</dd>
              <dt>状态</dt>
              <dd>{taskDetail.status}</dd>
              <dt>负责人</dt>
              <dd>{taskDetail.assigneeName}</dd>
              <dt>更新时间</dt>
              <dd>{taskDetail.updatedAt}</dd>
            </dl>
            <section className={styles.identityBlock}>
              <h4 className={styles.identityBlockTitle}>本任务使用的身份</h4>
              {taskDetail.identitySummary ? (
                <>
                  <div className={styles.kvGrid}>
                    <span className={styles.kvLabel}>身份名称</span>
                    <span>{taskDetail.identitySummary.name}</span>
                    <span className={styles.kvLabel}>身份类型</span>
                    <span>{taskDetail.identitySummary.type}</span>
                  </div>
                  <p className={styles.corePositioning}>{taskDetail.identitySummary.corePositioningSummary}</p>
                  {taskDetail.identityId && (
                    <Link to={`${ROUTES.TENANT.IDENTITIES}/${taskDetail.identityId}`} className={styles.placeholderAction}>
                      查看身份详情
                    </Link>
                  )}
                </>
              ) : (
                <p className={styles.emptyHint}>未指定身份</p>
              )}
            </section>
          </div>
        )}
      </Drawer>

      <Drawer open={createOpen} onClose={() => setCreateOpen(false)} title="创建任务" width={480}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>流程模板</label>
          <select
            className={styles.formSelect}
            value={createTemplateId}
            onChange={(e) => setCreateTemplateId(e.target.value)}
          >
            <option value="">请选择流程模板</option>
            {templates.filter((t) => t.status === 'active').map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} (v{t.version})
              </option>
            ))}
          </select>
          <p className={styles.formHint}>选择后将基于该流程创建实例与任务，任务以所选身份执行。</p>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>执行身份</label>
          <select
            className={styles.formSelect}
            value={createIdentityId}
            onChange={(e) => setCreateIdentityId(e.target.value)}
          >
            {identityList.length === 0 ? (
              <option value="">请先在身份配置中绑定身份</option>
            ) : (
              identityList.map((i) => (
                <option key={i.identityId} value={i.identityId}>
                  {i.name}
                  {i.isDefault ? ' (默认)' : ''}
                </option>
              ))
            )}
          </select>
          <p className={styles.formHint}>可选范围来自本项目已绑定身份；任务将以此身份执行。</p>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>任务名称</label>
          <input
            type="text"
            className={styles.formInput}
            value={createTaskName}
            onChange={(e) => setCreateTaskName(e.target.value)}
            placeholder="请输入任务名称"
          />
        </div>
        {createError && <p className={styles.formError}>{createError}</p>}
        <div className={styles.formActions}>
          <button type="button" className={styles.placeholderBtn} onClick={() => setCreateOpen(false)}>
            取消
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={handleCreateSubmit}
            disabled={
              createSubmitting ||
              identityList.length === 0 ||
              !createTemplateId?.trim() ||
              !createTaskName?.trim()
            }
          >
            {createSubmitting ? '创建中…' : '创建'}
          </button>
        </div>
      </Drawer>
    </>
  )
}
