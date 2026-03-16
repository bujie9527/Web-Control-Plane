import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { ListPageToolbar, listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import { Table } from '@/components/Table/Table'
import { Pagination } from '@/components/Pagination/Pagination'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { Dialog } from '@/components/Dialog/Dialog'
import { ROUTES } from '@/core/constants/routes'
import {
  changeWorkflowTemplateStatus,
  cloneWorkflowTemplateToTenant,
  listWorkflowTemplates,
  deleteWorkflowTemplate,
} from '@/modules/tenant/services/workflowTemplateFactoryService'
import type { WorkflowTemplate, WorkflowTemplateStatus } from '@/modules/tenant/schemas/workflowExecution'
import { PLANNING_MODE_LABELS } from './workflowTemplateLabels'
import styles from './WorkflowTemplateFactory.module.css'

const statusMap: Record<WorkflowTemplateStatus, 'success' | 'warning' | 'error' | 'neutral'> = {
  draft: 'neutral',
  active: 'success',
  deprecated: 'warning',
  archived: 'error',
  inactive: 'warning',
}
const statusLabels: Record<WorkflowTemplateStatus, string> = {
  draft: '草稿',
  active: '启用',
  deprecated: '已废弃',
  archived: '已归档',
  inactive: '停用',
}

export function WorkflowTemplateFactoryList() {
  const navigate = useNavigate()
  const [list, setList] = useState<WorkflowTemplate[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [scopeType, setScopeType] = useState<'' | 'system' | 'tenant'>('')
  const [status, setStatus] = useState<'' | WorkflowTemplateStatus>('')
  const [projectType, setProjectType] = useState('')
  const [goalType, setGoalType] = useState('')
  const [deliverableMode, setDeliverableMode] = useState('')
  const [planningMode, setPlanningMode] = useState<'' | 'manual' | 'ai_assisted' | 'hybrid'>('')
  const [isSystemPreset, setIsSystemPreset] = useState<'' | 'yes' | 'no'>('')

  const [cloneOpen, setCloneOpen] = useState(false)
  const [cloneTarget, setCloneTarget] = useState<WorkflowTemplate | null>(null)
  const [cloneTenantId, setCloneTenantId] = useState('t1')
  const [cloneError, setCloneError] = useState('')
  const [cloneLoading, setCloneLoading] = useState(false)

  const [statusOpen, setStatusOpen] = useState(false)
  const [statusTarget, setStatusTarget] = useState<WorkflowTemplate | null>(null)
  const [nextStatus, setNextStatus] = useState<WorkflowTemplateStatus>('active')
  const [statusLoading, setStatusLoading] = useState(false)
  const [notice, setNotice] = useState('')

  const showNotice = (msg: string) => {
    setNotice(msg)
    window.setTimeout(() => setNotice(''), 2500)
  }

  const handleDelete = async (r: WorkflowTemplate) => {
    if (r.isSystemPreset) {
      showNotice('系统预置模板不可删除，只能停用或归档')
      return
    }
    const ok = window.confirm(`确认删除流程模板「${r.name}」吗？删除后无法恢复。`)
    if (!ok) return
    try {
      const res = await deleteWorkflowTemplate(r.id)
      if (!res.success) {
        showNotice(res.reason === 'SYSTEM_BUILT_IN' ? '系统预置模板不可删除' : '删除失败')
        return
      }
      showNotice('已删除该流程模板')
      load()
    } catch (e) {
      showNotice(e instanceof Error ? e.message : '删除失败')
    }
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listWorkflowTemplates({
        page,
        pageSize,
        keyword: keyword.trim() || undefined,
        scopeType: scopeType || undefined,
        status: status || undefined,
        projectType: projectType || undefined,
        goalType: goalType || undefined,
        deliverableMode: deliverableMode || undefined,
        planningMode: planningMode || undefined,
        isSystemPreset:
          isSystemPreset === '' ? undefined : isSystemPreset === 'yes',
      })
      setList(res.items)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [
    page,
    pageSize,
    keyword,
    scopeType,
    status,
    projectType,
    goalType,
    deliverableMode,
    planningMode,
    isSystemPreset,
  ])

  useEffect(() => {
    load()
  }, [load])

  const columns = [
    { key: 'name', title: '模板名称', width: '180px' },
    { key: 'code', title: '编码', width: '140px' },
    {
      key: 'scopeType',
      title: '作用域',
      width: '90px',
      render: (_: unknown, r: WorkflowTemplate) => (r.scopeType === 'system' ? '平台' : '租户'),
    },
    {
      key: 'status',
      title: '状态',
      width: '90px',
      render: (_: unknown, r: WorkflowTemplate) => (
        <StatusTag type={statusMap[r.status]}>{statusLabels[r.status]}</StatusTag>
      ),
    },
    { key: 'supportedProjectTypeId', title: '项目类型', width: '130px' },
    {
      key: 'supportedGoalTypeIds',
      title: '目标类型',
      width: '180px',
      render: (_: unknown, r: WorkflowTemplate) => r.supportedGoalTypeIds.join('、'),
    },
    {
      key: 'supportedDeliverableModes',
      title: '交付模式',
      width: '140px',
      render: (_: unknown, r: WorkflowTemplate) => r.supportedDeliverableModes.join('、'),
    },
    { key: 'planningMode', title: '规划模式', width: '100px' },
    { key: 'nodeCount', title: '节点数', width: '70px' },
    {
      key: 'action',
      title: '操作',
      width: '260px',
      render: (_: unknown, r: WorkflowTemplate) => (
        <div className={listPageStyles.actions}>
          <button
            type="button"
            className={listPageStyles.linkBtn}
            onClick={() => navigate(ROUTES.SYSTEM.WORKFLOW_TEMPLATES_DETAIL(r.id))}
          >
            查看
          </button>
          <button
            type="button"
            className={listPageStyles.linkBtn}
            onClick={() => navigate(ROUTES.SYSTEM.WORKFLOW_TEMPLATES_EDIT(r.id))}
          >
            编辑
          </button>
          {r.scopeType === 'system' && (
            <button
              type="button"
              className={listPageStyles.linkBtn}
              onClick={() => {
                setCloneTarget(r)
                setCloneError('')
                setCloneOpen(true)
              }}
            >
              复制到租户
            </button>
          )}
          <button
            type="button"
            className={listPageStyles.linkBtn}
            onClick={() => {
              setStatusTarget(r)
              setNextStatus(r.status)
              setStatusOpen(true)
            }}
          >
            状态切换
          </button>
          {!r.isSystemPreset && (
            <button type="button" className={listPageStyles.linkBtn} onClick={() => handleDelete(r)}>
              删除
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <PageContainer
      title="流程模板工厂"
      description="平台级流程模板资产管理：新建、编辑、治理、发布、复制、复用"
    >
      {notice && <p style={{ padding: '8px 16px', margin: '0 0 8px', background: '#fff3cd', color: '#856404', borderRadius: 4, fontSize: 14 }}>{notice}</p>}
      <Card title="模板列表" description="系统模板与租户模板两层体系">
        <ListPageToolbar
          primaryAction={
            <button
              type="button"
              className={listPageStyles.primaryBtn}
              onClick={() => navigate(ROUTES.SYSTEM.WORKFLOW_PLANNING_NEW)}
            >
              发起流程规划
            </button>
          }
        >
          <input
            type="text"
            className={listPageStyles.search}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索名称/编码"
          />
          <select className={listPageStyles.select} value={scopeType} onChange={(e) => setScopeType(e.target.value as '' | 'system' | 'tenant')}>
            <option value="">全部作用域</option>
            <option value="system">平台</option>
            <option value="tenant">租户</option>
          </select>
          <select className={listPageStyles.select} value={status} onChange={(e) => setStatus(e.target.value as '' | WorkflowTemplateStatus)}>
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="active">启用</option>
            <option value="deprecated">已废弃</option>
            <option value="archived">已归档</option>
          </select>
          <input
            type="text"
            className={listPageStyles.search}
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
            placeholder="项目类型"
          />
          <input
            type="text"
            className={listPageStyles.search}
            value={goalType}
            onChange={(e) => setGoalType(e.target.value)}
            placeholder="目标类型"
          />
          <input
            type="text"
            className={listPageStyles.search}
            value={deliverableMode}
            onChange={(e) => setDeliverableMode(e.target.value)}
            placeholder="交付模式"
          />
          <select className={listPageStyles.select} value={planningMode} onChange={(e) => setPlanningMode(e.target.value as '' | 'manual' | 'ai_assisted' | 'hybrid')}>
            <option value="">全部规划模式</option>
            <option value="manual">{PLANNING_MODE_LABELS.manual}</option>
            <option value="ai_assisted">{PLANNING_MODE_LABELS.ai_assisted}</option>
            <option value="hybrid">{PLANNING_MODE_LABELS.hybrid}</option>
          </select>
          <select className={listPageStyles.select} value={isSystemPreset} onChange={(e) => setIsSystemPreset(e.target.value as '' | 'yes' | 'no')}>
            <option value="">系统预设</option>
            <option value="yes">是</option>
            <option value="no">否</option>
          </select>
          <button type="button" className={listPageStyles.queryBtn} onClick={() => setPage(1)}>
            查询
          </button>
        </ListPageToolbar>

        <Table columns={columns} dataSource={list} rowKey="id" loading={loading} emptyText="暂无流程模板" />
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

      <Dialog
        open={cloneOpen}
        onClose={() => setCloneOpen(false)}
        title="复制到租户"
        width={420}
        footer={
          <div className={styles.formActions}>
            <button
              type="button"
              className={listPageStyles.primaryBtn}
              onClick={async () => {
                if (!cloneTarget) return
                if (!cloneTenantId.trim()) {
                  setCloneError('请输入租户 ID')
                  return
                }
                setCloneLoading(true)
                setCloneError('')
                try {
                  await cloneWorkflowTemplateToTenant(cloneTarget.id, cloneTenantId.trim())
                  setCloneOpen(false)
                  load()
                } catch (e) {
                  setCloneError(e instanceof Error ? e.message : '复制失败')
                } finally {
                  setCloneLoading(false)
                }
              }}
              disabled={cloneLoading}
            >
              {cloneLoading ? '复制中...' : '确认复制'}
            </button>
            <button type="button" className={listPageStyles.linkBtn} onClick={() => setCloneOpen(false)}>
              取消
            </button>
          </div>
        }
      >
        <p className={styles.copyHint}>模板：{cloneTarget?.name}</p>
        <div className={styles.formRow}>
          <label>目标租户 ID</label>
          <input value={cloneTenantId} onChange={(e) => setCloneTenantId(e.target.value)} />
        </div>
        {cloneError && <p className={styles.formError}>{cloneError}</p>}
      </Dialog>

      <Dialog
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        title="切换模板状态"
        width={420}
        footer={
          <div className={styles.formActions}>
            <button
              type="button"
              className={listPageStyles.primaryBtn}
              onClick={async () => {
                if (!statusTarget) return
                setStatusLoading(true)
                try {
                  await changeWorkflowTemplateStatus(statusTarget.id, nextStatus)
                  setStatusOpen(false)
                  load()
                } finally {
                  setStatusLoading(false)
                }
              }}
              disabled={statusLoading}
            >
              {statusLoading ? '保存中...' : '保存'}
            </button>
            <button type="button" className={listPageStyles.linkBtn} onClick={() => setStatusOpen(false)}>
              取消
            </button>
          </div>
        }
      >
        <p className={styles.copyHint}>模板：{statusTarget?.name}</p>
        <div className={styles.formRow}>
          <label>状态</label>
          <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value as WorkflowTemplateStatus)}>
            <option value="draft">草稿</option>
            <option value="active">启用</option>
            <option value="deprecated">已废弃</option>
            <option value="archived">已归档</option>
          </select>
        </div>
      </Dialog>
    </PageContainer>
  )
}
