import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { ListPageToolbar, listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import { Table } from '@/components/Table/Table'
import { Pagination } from '@/components/Pagination/Pagination'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { listPlanningSessions, deletePlanningSession } from '@/modules/tenant/services/workflowPlanningSessionService'
import type {
  WorkflowPlanningSession,
  PlanningSessionStatus,
  PlanningSourceType,
} from '@/modules/tenant/schemas/workflowPlanningSession'
import {
  PLANNING_SESSION_STATUS_LABELS,
  PLANNING_SOURCE_TYPE_LABELS,
  PLANNING_PROJECT_TYPE_LABELS,
  PLANNING_DELIVERABLE_LABELS,
  PLANNING_GOAL_TYPE_LABELS,
} from '@/core/labels/planningDisplayLabels'
import { SCOPE_TYPE_LABELS } from '@/modules/platform/pages/WorkflowTemplates/workflowTemplateLabels'
import styles from '@/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactory.module.css'

const statusMap: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  draft: 'neutral',
  in_progress: 'warning',
  completed: 'success',
  archived: 'error',
  canceled: 'neutral',
}

interface WorkflowPlanningListProps {
  scopeType: 'system' | 'tenant'
  tenantId?: string
  listRoute: string
  newRoute: string
  detailRoute: (id: string) => string
}

export function WorkflowPlanningList({
  scopeType,
  tenantId,
  listRoute: _listRoute,
  newRoute,
  detailRoute,
}: WorkflowPlanningListProps) {
  const navigate = useNavigate()
  const [list, setList] = useState<WorkflowPlanningSession[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [scopeFilter, setScopeFilter] = useState<'' | 'system' | 'tenant'>(scopeType)
  const [statusFilter, setStatusFilter] = useState<PlanningSessionStatus | ''>('')
  const [projectTypeFilter, setProjectTypeFilter] = useState('')
  const [deliverableFilter, setDeliverableFilter] = useState('')
  const [sourceTypeFilter, setSourceTypeFilter] = useState<PlanningSourceType | ''>('')
  const [notice, setNotice] = useState<string>('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listPlanningSessions({
        page,
        pageSize,
        scopeType: scopeFilter || undefined,
        tenantId,
        status: statusFilter || undefined,
        projectTypeId: projectTypeFilter || undefined,
        deliverableMode: deliverableFilter || undefined,
        sourceType: sourceTypeFilter || undefined,
      })
      setList(res.items)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [
    page,
    pageSize,
    scopeFilter,
    tenantId,
    statusFilter,
    projectTypeFilter,
    deliverableFilter,
    sourceTypeFilter,
  ])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async (id: string, title: string) => {
    const ok = window.confirm(`确认删除规划会话「${title}」吗？删除后无法恢复。`)
    if (!ok) return
    try {
      const success = await deletePlanningSession(id)
      if (!success) {
        setNotice('删除失败：会话可能不存在')
        return
      }
      setNotice('已删除该规划会话')
      await load()
    } catch (e) {
      setNotice(e instanceof Error ? e.message : '删除失败')
    } finally {
      window.setTimeout(() => setNotice(''), 2500)
    }
  }

  const columns = [
    { key: 'title', title: '规划标题', width: '180px' },
    {
      key: 'scopeType',
      title: '作用域',
      width: '80px',
      render: (_: unknown, r: WorkflowPlanningSession) => SCOPE_TYPE_LABELS[r.scopeType] ?? r.scopeType,
    },
    {
      key: 'sourceType',
      title: '来源类型',
      width: '90px',
      render: (_: unknown, r: WorkflowPlanningSession) =>
        PLANNING_SOURCE_TYPE_LABELS[r.sourceType] ?? r.sourceType,
    },
    {
      key: 'projectTypeId',
      title: '项目类型',
      width: '100px',
      render: (_: unknown, r: WorkflowPlanningSession) =>
        PLANNING_PROJECT_TYPE_LABELS[r.projectTypeId] ?? r.projectTypeId,
    },
    {
      key: 'goalTypeId',
      title: '目标类型',
      width: '100px',
      render: (_: unknown, r: WorkflowPlanningSession) =>
        PLANNING_GOAL_TYPE_LABELS[r.goalTypeId] ?? r.goalTypeId,
    },
    {
      key: 'deliverableMode',
      title: '交付模式',
      width: '100px',
      render: (_: unknown, r: WorkflowPlanningSession) =>
        PLANNING_DELIVERABLE_LABELS[r.deliverableMode] ?? r.deliverableMode,
    },
    {
      key: 'currentDraftVersion',
      title: '当前草案版本',
      width: '100px',
      render: (_: unknown, r: WorkflowPlanningSession) => r.currentDraftId ? 'v1' : '—',
    },
    {
      key: 'status',
      title: '状态',
      width: '90px',
      render: (_: unknown, r: WorkflowPlanningSession) => (
        <StatusTag type={statusMap[r.status] ?? 'neutral'}>
          {PLANNING_SESSION_STATUS_LABELS[r.status] ?? r.status}
        </StatusTag>
      ),
    },
    {
      key: 'updatedAt',
      title: '更新时间',
      width: '120px',
      render: (_: unknown, r: WorkflowPlanningSession) => r.updatedAt,
    },
    {
      key: 'action',
      title: '操作',
      width: '180px',
      render: (_: unknown, r: WorkflowPlanningSession) => (
        <span className={styles.actions}>
          <button
            type="button"
            className={listPageStyles.linkBtn}
            onClick={() => navigate(detailRoute(r.id))}
          >
            进入工作台
          </button>
          <button
            type="button"
            className={listPageStyles.linkBtn}
            onClick={() => handleDelete(r.id, r.title)}
          >
            删除
          </button>
        </span>
      ),
    },
  ]

  return (
    <PageContainer
      title="流程规划会话"
      description="基于 SOP 或目标共创流程草案，为后续生成正式流程模板做准备"
    >
      <Card
        title="规划列表"
        description={scopeType === 'system' ? '平台侧流程规划会话' : '租户侧流程规划会话'}
      >
        {notice && <p className={styles.formError}>{notice}</p>}
        <ListPageToolbar
          primaryAction={
            <button type="button" className={listPageStyles.primaryBtn} onClick={() => navigate(newRoute)}>
              新建规划
            </button>
          }
        >
          {scopeType === 'system' && (
            <select
              className={listPageStyles.select}
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value as '' | 'system' | 'tenant')}
            >
              <option value="">全部作用域</option>
              <option value="system">系统</option>
              <option value="tenant">租户</option>
            </select>
          )}
          <select
            className={listPageStyles.select}
            value={statusFilter}
            onChange={(e) => setStatusFilter((e.target.value || '') as '' | PlanningSessionStatus)}
          >
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="in_progress">规划中</option>
            <option value="completed">已完成</option>
            <option value="archived">已归档</option>
            <option value="canceled">已取消</option>
          </select>
          <select
            className={listPageStyles.select}
            value={projectTypeFilter}
            onChange={(e) => setProjectTypeFilter(e.target.value)}
          >
            <option value="">全部项目类型</option>
            <option value="pt-account-operation">账号运营</option>
            <option value="pt-website-operation">网站运营</option>
          </select>
          <select
            className={listPageStyles.select}
            value={deliverableFilter}
            onChange={(e) => setDeliverableFilter(e.target.value)}
          >
            <option value="">全部交付模式</option>
            <option value="social_content">社媒内容</option>
            <option value="data_sync">数据同步</option>
          </select>
          <select
            className={listPageStyles.select}
            value={sourceTypeFilter}
            onChange={(e) => setSourceTypeFilter((e.target.value || '') as '' | PlanningSourceType)}
          >
            <option value="">全部来源类型</option>
            <option value="sop_input">SOP 输入</option>
            <option value="goal_input">目标输入</option>
            <option value="manual">手动创建</option>
          </select>
          <button type="button" className={listPageStyles.queryBtn} onClick={() => setPage(1)}>
            查询
          </button>
        </ListPageToolbar>
        <Table columns={columns} dataSource={list} rowKey="id" loading={loading} emptyText="暂无规划会话" />
        {total > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s)
              setPage(1)
            }}
          />
        )}
      </Card>
    </PageContainer>
  )
}
