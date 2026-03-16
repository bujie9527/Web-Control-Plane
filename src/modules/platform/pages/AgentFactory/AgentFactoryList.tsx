import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { ListPageToolbar, listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import { Table } from '@/components/Table/Table'
import { Pagination } from '@/components/Pagination/Pagination'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { Dialog } from '@/components/Dialog/Dialog'
import {
  getTemplateList,
  cloneTemplate,
  changeStatus,
  deleteTemplate,
  getAgentTemplateReferences,
} from '../../services/agentTemplateService'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import type {
  AgentTemplate,
  AgentTemplateStatus,
  CloneAgentTemplatePayload,
} from '../../schemas/agentTemplate'
import {
  AGENT_ROLE_TYPE_LABELS,
  AGENT_CATEGORY_LABELS,
  AGENT_PLATFORM_TYPE_LABELS,
  EXECUTOR_TYPE_LABELS,
} from '@/core/labels/agentTemplateLabels'
import type { AgentPlatformType } from '../../schemas/agentTemplate'
import {
  PLANNER_TIER_LABELS,
  PLANNER_DOMAIN_LABELS,
} from '@/core/labels/planningDisplayLabels'
import { ROUTES } from '@/core/constants/routes'
import { CopyTemplateDialog } from './CopyTemplateDialog'
import styles from './AgentFactoryList.module.css'

const statusMap: Record<AgentTemplateStatus, 'success' | 'warning' | 'error' | 'neutral'> = {
  draft: 'neutral',
  active: 'success',
  inactive: 'warning',
  archived: 'error',
}

const statusLabels: Record<AgentTemplateStatus, string> = {
  draft: '草稿',
  active: '已发布',
  inactive: '已停用',
  archived: '已归档',
}

const roleTypeLabels = AGENT_ROLE_TYPE_LABELS

const PLATFORM_OPTIONS: { value: '' | AgentPlatformType; label: string }[] = [
  { value: '', label: '全部平台' },
  { value: 'general', label: '通用' },
  { value: 'facebook', label: 'Facebook 专用' },
  { value: 'x', label: 'X (Twitter) 专用' },
  { value: 'tiktok', label: 'TikTok 专用' },
  { value: 'instagram', label: 'Instagram 专用' },
  { value: 'wechat', label: '微信专用' },
]

export function AgentFactoryList() {
  const navigate = useNavigate()
  const [list, setList] = useState<AgentTemplate[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<AgentTemplateStatus | ''>('')
  const [platformFilter, setPlatformFilter] = useState<'' | AgentPlatformType>('')
  const [loading, setLoading] = useState(false)

  const [notice, setNotice] = useState('')

  /** 批量选择 */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false)
  const [batchDeleting, setBatchDeleting] = useState(false)

  const [copyDialogOpen, setCopyDialogOpen] = useState(false)
  const [copySource, setCopySource] = useState<AgentTemplate | null>(null)

  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [statusTargetId, setStatusTargetId] = useState<string | null>(null)
  const [statusTargetName, setStatusTargetName] = useState('')
  const [statusNew, setStatusNew] = useState<AgentTemplateStatus>('active')
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusError, setStatusError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getTemplateList({
        page,
        pageSize,
        keyword: keyword.trim() || undefined,
        status: statusFilter || undefined,
        platformType: platformFilter || undefined,
      })
      setList(res.items)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, keyword, statusFilter, platformFilter])

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(new Set(list.map((t) => t.id)))
    else setSelectedIds(new Set())
  }

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const handleBatchDelete = async () => {
    setBatchDeleting(true)
    let failCount = 0
    for (const id of selectedIds) {
      try {
        const refs = await getAgentTemplateReferences(id)
        const refCount = refs.workflowTemplateNodes.length + refs.workflowPlanningDraftNodes.length
        if (refCount > 0) { failCount++; continue }
        const res = await deleteTemplate(id)
        if (!res.success) failCount++
      } catch { failCount++ }
    }
    setBatchDeleting(false)
    setBatchDeleteOpen(false)
    setSelectedIds(new Set())
    if (failCount > 0) showNotice(`批量删除完成，其中 ${failCount} 条因被引用或为系统内置而跳过`)
    else showNotice('批量删除成功')
    load()
  }

  useEffect(() => {
    load()
  }, [load])

  const openCopyDialog = (t: AgentTemplate) => {
    setCopySource(t)
    setCopyDialogOpen(true)
  }

  const handleCopyConfirm = async (payload: CloneAgentTemplatePayload) => {
    if (!copySource) return
    await cloneTemplate(copySource.id, payload)
    setCopyDialogOpen(false)
    setCopySource(null)
    load()
  }

  const showNotice = (msg: string) => {
    setNotice(msg)
    window.setTimeout(() => setNotice(''), 2500)
  }

  const handleDelete = async (t: AgentTemplate) => {
    if (t.isSystemPreset) {
      showNotice('系统内置模板不可删除，只能停用或归档')
      return
    }
    const refs = await getAgentTemplateReferences(t.id)
    const refCount = refs.workflowTemplateNodes.length + refs.workflowPlanningDraftNodes.length
    if (refCount > 0) {
      showNotice(`该模板仍被 ${refCount} 个流程节点或草案引用，无法删除`)
      return
    }
    const ok = window.confirm(`确认删除模板「${t.nameZh ?? t.name}」吗？删除后无法恢复。`)
    if (!ok) return
    try {
      const res = await deleteTemplate(t.id)
      if (!res.success) {
        showNotice(res.reason === 'SYSTEM_BUILT_IN' ? '系统内置模板不可删除' : '删除失败')
        return
      }
      showNotice('已删除该模板')
      load()
    } catch (e) {
      showNotice(e instanceof Error ? e.message : '删除失败')
    }
  }

  const openStatusDialog = (t: AgentTemplate) => {
    setStatusTargetId(t.id)
    setStatusTargetName(t.name)
    setStatusNew(t.status)
    setStatusError('')
    setStatusDialogOpen(true)
  }

  const handleStatusSubmit = async () => {
    if (!statusTargetId) return
    setStatusSaving(true)
    setStatusError('')
    try {
      await changeStatus(statusTargetId, statusNew)
      setStatusDialogOpen(false)
      setStatusTargetId(null)
      load()
    } catch (e) {
      setStatusError(e instanceof Error ? e.message : '操作失败')
    } finally {
      setStatusSaving(false)
    }
  }

  const allSelected = list.length > 0 && list.every((t) => selectedIds.has(t.id))
  const someSelected = selectedIds.size > 0

  const columns = [
    {
      key: 'select',
      title: (
        <input
          type="checkbox"
          checked={allSelected}
          onChange={(e) => handleSelectAll(e.target.checked)}
          aria-label="全选"
        />
      ),
      width: '44px',
      render: (_: unknown, r: AgentTemplate) => (
        <input
          type="checkbox"
          checked={selectedIds.has(r.id)}
          onChange={(e) => handleSelectRow(r.id, e.target.checked)}
          aria-label={`选择 ${r.nameZh ?? r.name}`}
        />
      ),
    },
    {
      key: 'nameZh',
      title: '中文名称',
      width: '140px',
      render: (_: unknown, r: AgentTemplate) => r.nameZh ?? r.name,
    },
    { key: 'code', title: '编码', width: '130px' },
    {
      key: 'category',
      title: '分类',
      width: '80px',
      render: (_: unknown, r: AgentTemplate) => AGENT_CATEGORY_LABELS[r.category ?? ''] ?? r.category ?? '—',
    },
    {
      key: 'platformType',
      title: '平台',
      width: '100px',
      render: (_: unknown, r: AgentTemplate) =>
        AGENT_PLATFORM_TYPE_LABELS[r.platformType ?? 'general'] ?? '—',
    },
    {
      key: 'plannerTier',
      title: '规划层级',
      width: '90px',
      render: (_: unknown, r: AgentTemplate) =>
        r.category === 'planning' && r.plannerTier
          ? PLANNER_TIER_LABELS[r.plannerTier] ?? r.plannerTier
          : '—',
    },
    {
      key: 'plannerDomain',
      title: '垂直领域',
      width: '100px',
      render: (_: unknown, r: AgentTemplate) =>
        r.category === 'planning' && r.plannerDomain
          ? PLANNER_DOMAIN_LABELS[r.plannerDomain] ?? r.plannerDomain
          : '—',
    },
    {
      key: 'sourceTemplate',
      title: '来源模板',
      width: '140px',
      render: (_: unknown, r: AgentTemplate) =>
        r.category === 'planning' && r.sourceTemplateId
          ? (list.find((t) => t.id === r.sourceTemplateId)?.nameZh ?? r.sourceTemplateId)
          : '—',
    },
    {
      key: 'version',
      title: '版本',
      width: '70px',
      render: (_: unknown, r: AgentTemplate) => r.version ?? '—',
    },
    {
      key: 'isLatest',
      title: '最新',
      width: '60px',
      render: (_: unknown, r: AgentTemplate) => (r.isLatest ? '是' : '否'),
    },
    {
      key: 'roleType',
      title: '角色类型',
      width: '90px',
      render: (_: unknown, r: AgentTemplate) => roleTypeLabels[r.roleType],
    },
    {
      key: 'defaultExecutorType',
      title: '默认执行器',
      width: '90px',
      render: (_: unknown, r: AgentTemplate) => EXECUTOR_TYPE_LABELS[r.defaultExecutorType],
    },
    {
      key: 'skillCount',
      title: '关联 Skill',
      width: '90px',
      render: (_: unknown, r: AgentTemplate) => (r.supportedSkillIds?.length ?? 0).toString(),
    },
    {
      key: 'status',
      title: '状态',
      width: '90px',
      render: (_: unknown, r: AgentTemplate) => (
        <StatusTag type={statusMap[r.status]}>{statusLabels[r.status]}</StatusTag>
      ),
    },
    {
      key: 'isSystemPreset',
      title: '系统预置',
      width: '80px',
      render: (_: unknown, r: AgentTemplate) => (r.isSystemPreset ? '是' : '否'),
    },
    {
      key: 'action',
      title: '操作',
      width: '200px',
      render: (_: unknown, r: AgentTemplate) => (
        <div className={listPageStyles.actions}>
          <button type="button" className={listPageStyles.linkBtn} onClick={() => navigate(ROUTES.SYSTEM.AGENT_FACTORY_DETAIL(r.id))}>
            查看
          </button>
          <button type="button" className={listPageStyles.linkBtn} onClick={() => navigate(ROUTES.SYSTEM.AGENT_FACTORY_EDIT(r.id))}>
            编辑
          </button>
          {r.isCloneable && (
            <button type="button" className={listPageStyles.linkBtn} onClick={() => openCopyDialog(r)}>
              复制
            </button>
          )}
          <button type="button" className={listPageStyles.linkBtn} onClick={() => openStatusDialog(r)}>
            修改状态
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
      title="Agent 模板工厂"
      description="平台级 Agent 模板资产管理，供租户选用"
    >
      {notice && <p style={{ padding: '8px 16px', margin: '0 0 8px', background: '#fff3cd', color: '#856404', borderRadius: 4, fontSize: 14 }}>{notice}</p>}
      <Card title="模板列表" description="创建、编辑、复制、管理 Agent 模板">
        {someSelected && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', marginBottom: 8, background: '#e8f0fe', borderRadius: 4, fontSize: 14, color: '#1a73e8' }}>
            <span>已选 {selectedIds.size} 项</span>
            <button
              type="button"
              style={{ padding: '4px 12px', fontSize: 13, background: '#d93025', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
              onClick={() => setBatchDeleteOpen(true)}
            >
              批量删除
            </button>
            <button type="button" className={listPageStyles.linkBtn} onClick={() => setSelectedIds(new Set())}>
              取消选择
            </button>
          </div>
        )}
        <ListPageToolbar
          primaryAction={
            <button
              type="button"
              className={listPageStyles.primaryBtn}
              onClick={() => navigate(ROUTES.SYSTEM.AGENT_FACTORY_NEW)}
            >
              新建模板
            </button>
          }
        >
          <input
            type="text"
            className={listPageStyles.search}
            placeholder="搜索模板名称或编码"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <select
            className={listPageStyles.select}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AgentTemplateStatus | '')}
          >
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="active">已发布</option>
            <option value="inactive">已停用</option>
            <option value="archived">已归档</option>
          </select>
          <select
            className={listPageStyles.select}
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as '' | AgentPlatformType)}
          >
            {PLATFORM_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button type="button" className={listPageStyles.queryBtn} onClick={() => setPage(1)}>
            查询
          </button>
        </ListPageToolbar>
        {!loading && total === 0 ? (
          keyword || statusFilter || platformFilter ? (
            <EmptyState title="未找到匹配项" description="请调整搜索条件后重试" />
          ) : (
            <EmptyState
              title="暂无 Agent 模板"
              description="还没有创建任何模板，点击新建开始"
              action={
                <button type="button" className={listPageStyles.primaryBtn} onClick={() => navigate(ROUTES.SYSTEM.AGENT_FACTORY_NEW)}>
                  新建模板
                </button>
              }
            />
          )
        ) : (
          <Table
            columns={columns}
            dataSource={list}
            rowKey="id"
            loading={loading}
            emptyText="暂无 Agent 模板"
          />
        )}
        {total > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={(p) => { setPage(p); setSelectedIds(new Set()) }}
            onPageSizeChange={(s) => {
              setPageSize(s)
              setPage(1)
              setSelectedIds(new Set())
            }}
          />
        )}
      </Card>

      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        title="修改模板状态"
        width={360}
        footer={
          <div className={styles.formActions}>
            <button type="button" className={listPageStyles.primaryBtn} onClick={handleStatusSubmit} disabled={statusSaving}>
              {statusSaving ? '保存中...' : '确认'}
            </button>
            <button type="button" className={listPageStyles.linkBtn} onClick={() => setStatusDialogOpen(false)}>
              取消
            </button>
          </div>
        }
      >
        {statusError && <p className={styles.formError}>{statusError}</p>}
        <p className={styles.statusTarget}>模板：{statusTargetName}</p>
        <div className={styles.formRow}>
          <label>新状态</label>
          <select
            value={statusNew}
            onChange={(e) => setStatusNew(e.target.value as AgentTemplateStatus)}
          >
            {Object.entries(statusLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </Dialog>

      {copySource && (
        <CopyTemplateDialog
          key={copySource.id}
          open={copyDialogOpen}
          onClose={() => {
            setCopyDialogOpen(false)
            setCopySource(null)
          }}
          source={copySource}
          onConfirm={handleCopyConfirm}
        />
      )}

      <Dialog
        open={batchDeleteOpen}
        onClose={() => setBatchDeleteOpen(false)}
        title="批量删除确认"
        width={420}
        footer={
          <div className={styles.formActions}>
            <button
              type="button"
              style={{ padding: '7px 20px', fontSize: 14, background: '#d93025', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', opacity: batchDeleting ? 0.6 : 1 }}
              onClick={handleBatchDelete}
              disabled={batchDeleting}
            >
              {batchDeleting ? '删除中...' : '确认删除'}
            </button>
            <button type="button" className={listPageStyles.linkBtn} onClick={() => setBatchDeleteOpen(false)}>
              取消
            </button>
          </div>
        }
      >
        <p className={styles.statusTarget}>
          将删除 {selectedIds.size} 个 Agent 模板。系统内置模板及被流程节点引用的模板将自动跳过。此操作不可撤销。
        </p>
      </Dialog>
    </PageContainer>
  )
}
