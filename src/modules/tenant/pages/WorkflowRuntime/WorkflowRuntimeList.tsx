/**
 * 流程运行中心列表页（Phase 13）
 * 平台 / 租户共用，通过 mode 区分数据源
 */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { ListPageToolbar, listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import { Table } from '@/components/Table/Table'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { getRuntimeListForTenant, getRuntimeListForPlatform } from '@/modules/tenant/services/workflowRuntimeService'
import type { WorkflowRuntimeListItem } from '@/modules/tenant/services/workflowRuntimeService'
import type { WorkflowInstanceStatus } from '@/modules/tenant/schemas/workflowExecution'
import { WORKFLOW_INSTANCE_STATUS_LABELS } from '@/core/labels/workflowRuntimeLabels'
import { useAuth } from '@/core/auth/AuthContext'
import { ROUTES } from '@/core/constants/routes'

const statusMap: Record<WorkflowInstanceStatus, 'success' | 'warning' | 'error' | 'neutral'> = {
  draft: 'neutral',
  pending: 'neutral',
  running: 'success',
  waiting_review: 'warning',
  success: 'success',
  failed: 'error',
  canceled: 'neutral',
}

interface WorkflowRuntimeListProps {
  mode: 'platform' | 'tenant'
}

export function WorkflowRuntimeList({ mode }: WorkflowRuntimeListProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const tenantId = user?.tenant?.tenantId ?? 't1'

  const [list, setList] = useState<WorkflowRuntimeListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<WorkflowInstanceStatus | ''>('')
  const [waitingForReviewFilter, setWaitingForReviewFilter] = useState<'' | 'yes' | 'no'>('')
  const [isFailedFilter, setIsFailedFilter] = useState<'' | 'yes' | 'no'>('')
  const [keyword, setKeyword] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const raw =
        mode === 'platform'
          ? await getRuntimeListForPlatform(tenantId || '')
          : await getRuntimeListForTenant(tenantId)
      let filtered = raw
      if (statusFilter) filtered = filtered.filter((r) => r.status === statusFilter)
      if (waitingForReviewFilter === 'yes') filtered = filtered.filter((r) => r.waitingForReview)
      if (waitingForReviewFilter === 'no') filtered = filtered.filter((r) => !r.waitingForReview)
      if (isFailedFilter === 'yes') filtered = filtered.filter((r) => r.isFailed)
      if (isFailedFilter === 'no') filtered = filtered.filter((r) => !r.isFailed)
      if (keyword.trim()) {
        const k = keyword.trim().toLowerCase()
        filtered = filtered.filter(
          (r) =>
            (r.instanceName?.toLowerCase().includes(k)) ||
            (r.projectName?.toLowerCase().includes(k)) ||
            (r.templateName?.toLowerCase().includes(k))
        )
      }
      setList(filtered)
    } finally {
      setLoading(false)
    }
  }, [mode, tenantId, statusFilter, waitingForReviewFilter, isFailedFilter, keyword])

  useEffect(() => {
    load()
  }, [load])

  const getDetailPath = (id: string) =>
    mode === 'platform' ? ROUTES.SYSTEM.WORKFLOW_RUNTIME_DETAIL(id) : ROUTES.TENANT.WORKFLOW_RUNTIME_DETAIL(id)

  const columns = [
    { key: 'instanceName', title: '流程实例', width: '200px', render: (_: unknown, r: WorkflowRuntimeListItem) => r.instanceName ?? r.sourceSummary ?? '—' },
    { key: 'projectName', title: '所属项目', width: '140px', render: (_: unknown, r: WorkflowRuntimeListItem) => r.projectName ?? '—' },
    { key: 'templateName', title: '模板名称', width: '140px', render: (_: unknown, r: WorkflowRuntimeListItem) => r.templateName ?? '—' },
    {
      key: 'status',
      title: '状态',
      width: '100px',
      render: (_: unknown, r: WorkflowRuntimeListItem) => (
        <StatusTag type={statusMap[r.status as WorkflowInstanceStatus]}>{WORKFLOW_INSTANCE_STATUS_LABELS[r.status as WorkflowInstanceStatus]}</StatusTag>
      ),
    },
    { key: 'currentNodeName', title: '当前节点', width: '120px', render: (_: unknown, r: WorkflowRuntimeListItem) => r.currentNodeName ?? '—' },
    { key: 'progressText', title: '完成进度', width: '90px', render: (_: unknown, r: WorkflowRuntimeListItem) => r.progressText ?? '—' },
    {
      key: 'waitingForReview',
      title: '等待审核',
      width: '90px',
      render: (_: unknown, r: WorkflowRuntimeListItem) => (r.waitingForReview ? '是' : '—'),
    },
    { key: 'updatedAt', title: '更新时间', width: '140px' },
    {
      key: 'action',
      title: '操作',
      width: '100px',
      render: (_: unknown, r: WorkflowRuntimeListItem) => (
        <div className={listPageStyles.actions}>
          <button
            type="button"
            className={listPageStyles.linkBtn}
            onClick={() => navigate(getDetailPath(r.id))}
          >
            查看
          </button>
        </div>
      ),
    },
  ]

  return (
    <PageContainer
      title="流程运行中心"
      description="查看和管理 WorkflowInstance 运行状态、节点进度与人工操作"
    >
      <ListPageToolbar>
        <input
          type="text"
          className={listPageStyles.search}
          placeholder="搜索流程名称、项目、模板"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <select
          className={listPageStyles.select}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as WorkflowInstanceStatus | '')}
        >
          <option value="">全部状态</option>
          {Object.entries(WORKFLOW_INSTANCE_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          className={listPageStyles.select}
          value={waitingForReviewFilter}
          onChange={(e) => setWaitingForReviewFilter(e.target.value as '' | 'yes' | 'no')}
        >
          <option value="">是否等待审核</option>
          <option value="yes">是</option>
          <option value="no">否</option>
        </select>
        <select
          className={listPageStyles.select}
          value={isFailedFilter}
          onChange={(e) => setIsFailedFilter(e.target.value as '' | 'yes' | 'no')}
        >
          <option value="">是否失败</option>
          <option value="yes">是</option>
          <option value="no">否</option>
        </select>
        <button type="button" className={listPageStyles.queryBtn} onClick={() => load()}>
          查询
        </button>
      </ListPageToolbar>
      <Table
        columns={columns}
        dataSource={list}
        rowKey="id"
        loading={loading}
        emptyText="暂无流程实例"
      />
    </PageContainer>
  )
}
