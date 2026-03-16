import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { ListPageToolbar, listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import { Table } from '@/components/Table/Table'
import { Pagination } from '@/components/Pagination/Pagination'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { Dialog } from '@/components/Dialog/Dialog'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import {
  getSkillList,
  changeSkillStatus,
  deleteSkill,
  importOpenClawSkill,
} from '../../services/skillService'
import type { Skill, SkillStatus } from '../../schemas/skill'
import {
  SKILL_STATUS_LABELS,
  SKILL_CATEGORY_LABELS,
  SKILL_EXECUTION_TYPE_LABELS,
} from '@/core/labels/skillLabels'
import { ROUTES } from '@/core/constants/routes'
import styles from './SkillFactory.module.css'

const statusTagMap: Record<SkillStatus, 'success' | 'warning'> = {
  active: 'success',
  inactive: 'warning',
}

export function SkillFactoryList() {
  const navigate = useNavigate()

  const [list, setList] = useState<Skill[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<SkillStatus | ''>('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importContent, setImportContent] = useState('')
  const [importFormat, setImportFormat] = useState<'auto' | 'json' | 'yaml'>('auto')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')

  /** 批量选择 */
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false)
  const [batchDeleting, setBatchDeleting] = useState(false)

  /** 单行删除 */
  const [deleteTarget, setDeleteTarget] = useState<Skill | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  /** 状态修改 */
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [statusTarget, setStatusTarget] = useState<Skill | null>(null)
  const [statusNew, setStatusNew] = useState<SkillStatus>('active')
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusError, setStatusError] = useState('')

  const showNotice = (msg: string) => {
    setNotice(msg)
    window.setTimeout(() => setNotice(''), 2500)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getSkillList({
        page,
        pageSize,
        keyword: keyword.trim() || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
      })
      setList(res.items)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, keyword, statusFilter, categoryFilter])

  useEffect(() => {
    load()
  }, [load])

  const handleQuery = () => {
    setPage(1)
    setSelectedIds(new Set())
  }

  const handleImportOpenClaw = async () => {
    if (!importContent.trim()) {
      setImportError('请输入 OpenClaw JSON/YAML 内容')
      return
    }
    setImporting(true)
    setImportError('')
    try {
      const skill = await importOpenClawSkill({ content: importContent, format: importFormat })
      showNotice(`已导入 Skill「${skill.nameZh ?? skill.name}」`)
      setImportDialogOpen(false)
      setImportContent('')
      setImportFormat('auto')
      load()
    } catch (e) {
      setImportError(e instanceof Error ? e.message : '导入失败')
    } finally {
      setImporting(false)
    }
  }

  /** 全选 / 取消全选 */
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(list.map((s) => s.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  /** 单行选择 */
  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  /** 单行删除 */
  const openDeleteDialog = (skill: Skill) => {
    if (skill.isSystemPreset) {
      showNotice('系统内置 Skill 不可删除，只能停用')
      return
    }
    setDeleteTarget(skill)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await deleteSkill(deleteTarget.id)
      if (!res.success) {
        const msg = (res as { messageZh?: string }).messageZh ?? (res.reason === 'SYSTEM_BUILT_IN' ? '系统内置 Skill 不可删除' : '删除失败')
        showNotice(msg)
      } else {
        showNotice(`已删除「${deleteTarget.nameZh ?? deleteTarget.name}」`)
        setSelectedIds((prev) => {
          const next = new Set(prev)
          next.delete(deleteTarget.id)
          return next
        })
        load()
      }
    } catch {
      showNotice('删除失败，请重试')
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
    }
  }

  /** 批量删除 */
  const handleBatchDelete = async () => {
    setBatchDeleting(true)
    let failCount = 0
    for (const id of selectedIds) {
      try {
        const res = await deleteSkill(id)
        if (!res.success) failCount++
      } catch {
        failCount++
      }
    }
    setBatchDeleting(false)
    setBatchDeleteOpen(false)
    setSelectedIds(new Set())
    if (failCount > 0) showNotice(`批量删除完成，其中 ${failCount} 条失败（系统内置或被引用）`)
    else showNotice('批量删除成功')
    load()
  }

  /** 修改状态 */
  const openStatusDialog = (skill: Skill) => {
    setStatusTarget(skill)
    setStatusNew(skill.status)
    setStatusError('')
    setStatusDialogOpen(true)
  }

  const handleStatusSubmit = async () => {
    if (!statusTarget) return
    setStatusSaving(true)
    setStatusError('')
    try {
      await changeSkillStatus(statusTarget.id, statusNew)
      setStatusDialogOpen(false)
      setStatusTarget(null)
      showNotice('状态已更新')
      load()
    } catch (e) {
      setStatusError(e instanceof Error ? e.message : '操作失败')
    } finally {
      setStatusSaving(false)
    }
  }

  const allSelected = list.length > 0 && list.every((s) => selectedIds.has(s.id))
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
      render: (_: unknown, r: Skill) => (
        <input
          type="checkbox"
          checked={selectedIds.has(r.id)}
          onChange={(e) => handleSelectRow(r.id, e.target.checked)}
          aria-label={`选择 ${r.nameZh ?? r.name}`}
        />
      ),
    },
    {
      key: 'name',
      title: '技能名称',
      width: '140px',
      render: (_: unknown, r: Skill) => (
        <button
          type="button"
          className={listPageStyles.linkBtn}
          onClick={() => navigate(ROUTES.SYSTEM.SKILL_FACTORY_DETAIL(r.id))}
        >
          {r.nameZh ?? r.name}
        </button>
      ),
    },
    { key: 'code', title: '编码', width: '130px' },
    {
      key: 'category',
      title: '分类',
      width: '90px',
      render: (_: unknown, r: Skill) =>
        SKILL_CATEGORY_LABELS[r.category] ?? r.category,
    },
    {
      key: 'executionType',
      title: '执行类型',
      width: '110px',
      render: (_: unknown, r: Skill) =>
        SKILL_EXECUTION_TYPE_LABELS[r.executionType] ?? r.executionType,
    },
    {
      key: 'agentCount',
      title: '绑定 Agent 数',
      width: '100px',
      render: (_: unknown, r: Skill) =>
        (r.boundAgentTemplateIds?.length ?? 0).toString(),
    },
    {
      key: 'version',
      title: '版本',
      width: '70px',
    },
    {
      key: 'isSystemPreset',
      title: '系统预置',
      width: '80px',
      render: (_: unknown, r: Skill) => (r.isSystemPreset ? '是' : '否'),
    },
    {
      key: 'status',
      title: '状态',
      width: '90px',
      render: (_: unknown, r: Skill) => (
        <StatusTag type={statusTagMap[r.status]}>
          {SKILL_STATUS_LABELS[r.status]}
        </StatusTag>
      ),
    },
    {
      key: 'createdAt',
      title: '创建时间',
      width: '110px',
      render: (_: unknown, r: Skill) => r.createdAt.slice(0, 10),
    },
    {
      key: 'action',
      title: '操作',
      width: '180px',
      render: (_: unknown, r: Skill) => (
        <div className={listPageStyles.actions}>
          <button
            type="button"
            className={listPageStyles.linkBtn}
            onClick={() => navigate(ROUTES.SYSTEM.SKILL_FACTORY_DETAIL(r.id))}
          >
            查看
          </button>
          <button
            type="button"
            className={listPageStyles.linkBtn}
            onClick={() => navigate(ROUTES.SYSTEM.SKILL_FACTORY_EDIT(r.id))}
          >
            编辑
          </button>
          <button
            type="button"
            className={listPageStyles.linkBtn}
            onClick={() => openStatusDialog(r)}
          >
            {r.status === 'active' ? '停用' : '启用'}
          </button>
          {!r.isSystemPreset && (
            <button
              type="button"
              className={listPageStyles.linkBtn}
              onClick={() => openDeleteDialog(r)}
            >
              删除
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <PageContainer
      title="Skill 工厂"
      description="平台级 Skill 能力资产治理，管理 Agent 可调用的能力"
    >
      {notice && (
        <p className={styles.notice}>{notice}</p>
      )}

      <Card title="Skill 列表" description="管理平台级 Skill 能力资产">
        {/** 批量操作提示条 */}
        {someSelected && (
          <div className={styles.batchBar}>
            <span>已选 {selectedIds.size} 项</span>
            <button
              type="button"
              className={styles.batchDeleteBtn}
              onClick={() => setBatchDeleteOpen(true)}
            >
              批量删除
            </button>
            <button
              type="button"
              className={listPageStyles.linkBtn}
              onClick={() => setSelectedIds(new Set())}
            >
              取消选择
            </button>
          </div>
        )}

        <ListPageToolbar
          primaryAction={
            <div className={styles.toolbarActions}>
              <button
                type="button"
                className={styles.importBtn}
                onClick={() => {
                  setImportError('')
                  setImportDialogOpen(true)
                }}
              >
                导入 OpenClaw
              </button>
              <button
                type="button"
                className={listPageStyles.primaryBtn}
                onClick={() => navigate(ROUTES.SYSTEM.SKILL_FACTORY_NEW)}
              >
                新建 Skill
              </button>
            </div>
          }
        >
          <input
            type="text"
            className={listPageStyles.search}
            placeholder="搜索 Skill 名称或编码"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <select
            className={listPageStyles.select}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SkillStatus | '')}
          >
            <option value="">全部状态</option>
            <option value="active">已启用</option>
            <option value="inactive">已停用</option>
          </select>
          <select
            className={listPageStyles.select}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">全部分类</option>
            {Object.entries(SKILL_CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button
            type="button"
            className={listPageStyles.queryBtn}
            onClick={handleQuery}
          >
            查询
          </button>
        </ListPageToolbar>

        {!loading && total === 0 ? (
          keyword || statusFilter || categoryFilter ? (
            <EmptyState
              title="未找到匹配项"
              description="请调整搜索条件后重试"
            />
          ) : (
            <EmptyState
              title="暂无 Skill"
              description="还没有创建任何 Skill，点击新建开始"
              action={
                <button
                  type="button"
                  className={listPageStyles.primaryBtn}
                  onClick={() => navigate(ROUTES.SYSTEM.SKILL_FACTORY_NEW)}
                >
                  新建 Skill
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
            emptyText="暂无 Skill"
          />
        )}

        {total > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={(p) => {
              setPage(p)
              setSelectedIds(new Set())
            }}
            onPageSizeChange={(s) => {
              setPageSize(s)
              setPage(1)
              setSelectedIds(new Set())
            }}
          />
        )}
      </Card>

      {/** 单行删除确认 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setDeleteTarget(null) }}
        title="确认删除"
        width={400}
        footer={
          <div className={styles.dialogActions}>
            <button
              type="button"
              className={styles.dangerBtn}
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? '删除中...' : '确认删除'}
            </button>
            <button
              type="button"
              className={listPageStyles.linkBtn}
              onClick={() => { setDeleteDialogOpen(false); setDeleteTarget(null) }}
            >
              取消
            </button>
          </div>
        }
      >
        <p className={styles.confirmText}>
          确定要删除「{deleteTarget?.nameZh ?? deleteTarget?.name}」吗？此操作不可撤销。
        </p>
      </Dialog>

      <Dialog
        open={importDialogOpen}
        onClose={() => {
          setImportDialogOpen(false)
          setImportError('')
        }}
        title="导入 OpenClaw Skill"
        width={760}
        footer={
          <div className={styles.dialogActions}>
            <button
              type="button"
              className={listPageStyles.primaryBtn}
              onClick={handleImportOpenClaw}
              disabled={importing}
            >
              {importing ? '导入中...' : '确认导入'}
            </button>
            <button
              type="button"
              className={listPageStyles.linkBtn}
              onClick={() => {
                setImportDialogOpen(false)
                setImportError('')
              }}
            >
              取消
            </button>
          </div>
        }
      >
        {importError && <p className={styles.errorText}>{importError}</p>}
        <div className={styles.formRow}>
          <label>格式</label>
          <select value={importFormat} onChange={(e) => setImportFormat(e.target.value as 'auto' | 'json' | 'yaml')}>
            <option value="auto">自动识别</option>
            <option value="json">JSON</option>
            <option value="yaml">YAML</option>
          </select>
        </div>
        <div className={styles.formRow}>
          <label>OpenClaw 内容</label>
          <textarea
            className={styles.importTextarea}
            value={importContent}
            onChange={(e) => setImportContent(e.target.value)}
            placeholder="粘贴 OpenClaw JSON/YAML 内容"
          />
        </div>
      </Dialog>

      {/** 批量删除确认 */}
      <Dialog
        open={batchDeleteOpen}
        onClose={() => setBatchDeleteOpen(false)}
        title="批量删除确认"
        width={400}
        footer={
          <div className={styles.dialogActions}>
            <button
              type="button"
              className={styles.dangerBtn}
              onClick={handleBatchDelete}
              disabled={batchDeleting}
            >
              {batchDeleting ? '删除中...' : '确认删除'}
            </button>
            <button
              type="button"
              className={listPageStyles.linkBtn}
              onClick={() => setBatchDeleteOpen(false)}
            >
              取消
            </button>
          </div>
        }
      >
        <p className={styles.confirmText}>
          将删除 {selectedIds.size} 个 Skill，系统内置 Skill 将自动跳过。此操作不可撤销。
        </p>
      </Dialog>

      {/** 修改状态 */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => { setStatusDialogOpen(false); setStatusTarget(null) }}
        title="修改 Skill 状态"
        width={360}
        footer={
          <div className={styles.dialogActions}>
            <button
              type="button"
              className={listPageStyles.primaryBtn}
              onClick={handleStatusSubmit}
              disabled={statusSaving}
            >
              {statusSaving ? '保存中...' : '确认'}
            </button>
            <button
              type="button"
              className={listPageStyles.linkBtn}
              onClick={() => { setStatusDialogOpen(false); setStatusTarget(null) }}
            >
              取消
            </button>
          </div>
        }
      >
        {statusError && <p className={styles.errorText}>{statusError}</p>}
        <p className={styles.confirmText}>Skill：{statusTarget?.nameZh ?? statusTarget?.name}</p>
        <div className={styles.formRow}>
          <label>新状态</label>
          <select
            value={statusNew}
            onChange={(e) => setStatusNew(e.target.value as SkillStatus)}
          >
            <option value="active">已启用</option>
            <option value="inactive">已停用</option>
          </select>
        </div>
      </Dialog>
    </PageContainer>
  )
}
