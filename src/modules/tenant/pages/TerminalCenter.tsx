import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { Table } from '@/components/Table/Table'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { ListPageToolbar, listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { Pagination } from '@/components/Pagination/Pagination'
import { Dialog } from '@/components/Dialog/Dialog'
import { useAuth } from '@/core/auth/AuthContext'
import {
  getTerminalList,
  getTerminalOverview,
  getRecentTerminalLogs,
  deleteTerminal,
  testTerminalById,
  type TerminalWithIdentity,
} from '../services/terminalService'
import type { TerminalLogItem } from '../schemas/terminal'
import { ROUTES } from '@/core/constants/routes'
import {
  TERMINAL_TYPE_CATEGORY_LABELS,
  TERMINAL_STATUS_LABELS as STATUS_LABELS,
  TERMINAL_STATUS_TAG_MAP as STATUS_TAG_MAP,
  TERMINAL_TEST_RESULT_LABELS as TEST_RESULT_LABELS,
} from '@/core/labels/terminalTypeLabels'
import styles from './SkeletonPages.module.css'

const TYPE_CATEGORY_OPTIONS = [
  { value: '', label: '全部类别' },
  { value: 'api', label: 'API 接口' },
  { value: 'browser', label: '浏览器控制' },
  { value: 'mcp', label: 'MCP 系统控制' },
]

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'active', label: '正常' },
  { value: 'inactive', label: '未激活' },
  { value: 'error', label: '异常' },
]

const logColumns = [
  { key: 'action', title: '操作', width: '100px' },
  { key: 'terminal', title: '终端', width: '120px' },
  {
    key: 'result',
    title: '结果',
    width: '80px',
    render: (_: unknown, r: TerminalLogItem) => <StatusTag type="success">{r.result}</StatusTag>,
  },
  { key: 'time', title: '时间', width: '140px' },
]

export function TerminalCenter() {
  const { user } = useAuth()
  const tenantId = user?.tenant?.tenantId ?? 't1'
  const navigate = useNavigate()

  const [overview, setOverview] = useState({ total: 0, api: 0, browser: 0, mcp: 0 })
  const [list, setList] = useState<TerminalWithIdentity[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [typeCategoryFilter, setTypeCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [recentLogs, setRecentLogs] = useState<TerminalLogItem[]>([])
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<TerminalWithIdentity | null>(null)
  const [deleteBatch, setDeleteBatch] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const [overviewRes, listRes, logsRes] = await Promise.all([
        getTerminalOverview(tenantId),
        getTerminalList({
          tenantId,
          page,
          pageSize,
          keyword: keyword.trim() || undefined,
          typeCategory: typeCategoryFilter || undefined,
          status: statusFilter || undefined,
        }),
        getRecentTerminalLogs(tenantId, 10),
      ])
      setOverview(overviewRes)
      setList(listRes.items)
      setTotal(listRes.total)
      setRecentLogs(logsRes)
    } finally {
      setLoading(false)
    }
  }, [tenantId, page, pageSize, keyword, typeCategoryFilter, statusFilter])

  useEffect(() => {
    load()
  }, [load])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === list.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(list.map((r) => r.id)))
  }

  const handleDeleteOne = (r: TerminalWithIdentity) => {
    setDeleteTarget(r)
    setDeleteBatch(false)
  }

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return
    if (selectedIds.size === 1) {
      const row = list.find((x) => x.id === [...selectedIds][0])
      if (row) { setDeleteTarget(row); setDeleteBatch(false) }
    } else {
      setDeleteTarget(null)
      setDeleteBatch(true)
    }
  }

  const confirmDelete = async () => {
    const ids = deleteBatch ? [...selectedIds] : deleteTarget ? [deleteTarget.id] : []
    if (ids.length === 0) return
    setDeleting(true)
    try {
      for (const id of ids) {
        await deleteTerminal(id)
      }
      setNotice('已删除')
      setDeleteTarget(null)
      setDeleteBatch(false)
      setSelectedIds(new Set())
      load()
      setTimeout(() => setNotice(''), 2500)
    } catch (e) {
      setNotice(e instanceof Error ? e.message : '删除失败')
      setTimeout(() => setNotice(''), 2500)
    } finally {
      setDeleting(false)
    }
  }

  const handleTest = async (id: string) => {
    setTestingId(id)
    try {
      await testTerminalById(id)
      setNotice('测试连接成功')
      load()
      setTimeout(() => setNotice(''), 2500)
    } catch (e) {
      setNotice(e instanceof Error ? e.message : '测试连接失败')
      setTimeout(() => setNotice(''), 2500)
    } finally {
      setTestingId(null)
    }
  }

  const listColumns = [
    {
      key: 'checkbox',
      title: (
        <input
          type="checkbox"
          checked={list.length > 0 && selectedIds.size === list.length}
          onChange={toggleSelectAll}
        />
      ),
      width: '48px',
      render: (_: unknown, r: TerminalWithIdentity) => (
        <input
          type="checkbox"
          checked={selectedIds.has(r.id)}
          onChange={() => toggleSelect(r.id)}
        />
      ),
    },
    {
      key: 'name',
      title: '终端名称',
      width: '160px',
      render: (_: unknown, r: TerminalWithIdentity) => (
        <button
          type="button"
          className={listPageStyles.linkBtn}
          style={{ padding: 0, background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => navigate(ROUTES.TENANT.TERMINAL_DETAIL(r.id))}
        >
          {r.name}
        </button>
      ),
    },
    { key: 'type', title: '类型', width: '120px', render: (_: unknown, r: TerminalWithIdentity) => r.type || '—' },
    {
      key: 'typeCategory',
      title: '类别',
      width: '100px',
      render: (_: unknown, r: TerminalWithIdentity) =>
        r.typeCategory ? (
          <StatusTag type="neutral">{TERMINAL_TYPE_CATEGORY_LABELS[r.typeCategory] ?? r.typeCategory}</StatusTag>
        ) : (
          '—'
        ),
    },
    {
      key: 'identityName',
      title: '绑定身份',
      width: '120px',
      render: (_: unknown, r: TerminalWithIdentity) => r.identityName ?? '—',
    },
    {
      key: 'linkedCount',
      title: '关联项目数',
      width: '100px',
      render: (_: unknown, r: TerminalWithIdentity) => (r.linkedProjectIds?.length ?? 0).toString(),
    },
    {
      key: 'lastTest',
      title: '最后测试',
      width: '140px',
      render: (_: unknown, r: TerminalWithIdentity) =>
        r.lastTestedAt
          ? `${r.lastTestedAt.slice(0, 10)} ${r.lastTestResult ? TEST_RESULT_LABELS[r.lastTestResult] ?? r.lastTestResult : ''}`
          : '—',
    },
    {
      key: 'status',
      title: '状态',
      width: '80px',
      render: (_: unknown, r: TerminalWithIdentity) => (
        <StatusTag type={STATUS_TAG_MAP[r.status] ?? 'neutral'}>{STATUS_LABELS[r.status] ?? r.status}</StatusTag>
      ),
    },
    {
      key: 'action',
      title: '操作',
      width: '200px',
      render: (_: unknown, r: TerminalWithIdentity) => (
        <div className={listPageStyles.actions}>
          <button
            type="button"
            className={listPageStyles.linkBtn}
            disabled={testingId === r.id}
            onClick={() => handleTest(r.id)}
          >
            {testingId === r.id ? '测试中…' : '测试连接'}
          </button>
          <button
            type="button"
            className={listPageStyles.linkBtn}
            onClick={() => navigate(ROUTES.TENANT.TERMINAL_DETAIL(r.id))}
          >
            查看
          </button>
          <button
            type="button"
            className={listPageStyles.linkBtn}
            onClick={() => handleDeleteOne(r)}
          >
            删除
          </button>
        </div>
      ),
    },
  ]

  const hasFilter = !!(keyword.trim() || typeCategoryFilter || statusFilter)
  const emptyNoData = !loading && total === 0 && !hasFilter
  const emptyNoMatch = !loading && total === 0 && hasFilter

  return (
    <PageContainer
      title="终端中心"
      description="社媒账号、Web 自动化、系统终端、API 接入与执行日志"
    >
      {notice && (
        <p style={{ padding: '8px 16px', margin: '0 0 8px', background: '#e8f5e9', color: '#2e7d32', borderRadius: 4, fontSize: 14 }}>
          {notice}
        </p>
      )}

      <Card title="终端总览" description="各类型终端数量">
        {loading ? (
          <p className={styles.placeholder}>加载中...</p>
        ) : (
          <div className={styles.kvList}>
            <span>终端总数：{overview.total}</span>
            <span>API 接口：{overview.api}</span>
            <span>浏览器控制：{overview.browser}</span>
            <span>MCP 系统控制：{overview.mcp}</span>
          </div>
        )}
      </Card>

      <Card title="终端列表" description="本租户已配置的执行终端">
        <ListPageToolbar
          primaryAction={
            <button
              type="button"
              className={listPageStyles.primaryBtn}
              onClick={() => navigate(ROUTES.TENANT.TERMINAL_NEW)}
            >
              新建终端
            </button>
          }
        >
          <input
            type="text"
            className={listPageStyles.search}
            placeholder="搜索终端名称"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <select
            className={listPageStyles.select}
            value={typeCategoryFilter}
            onChange={(e) => setTypeCategoryFilter(e.target.value)}
          >
            {TYPE_CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            className={listPageStyles.select}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button type="button" className={listPageStyles.queryBtn} onClick={() => setPage(1)}>
            查询
          </button>
        </ListPageToolbar>

        {selectedIds.size > 0 && (
          <div className={styles.batchBar} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span>已选 {selectedIds.size} 项</span>
            <button type="button" className={listPageStyles.linkBtn} onClick={handleBatchDelete}>
              批量删除
            </button>
            <button type="button" className={listPageStyles.linkBtn} onClick={() => setSelectedIds(new Set())}>
              取消选择
            </button>
          </div>
        )}

        {emptyNoMatch && (
          <EmptyState title="未找到匹配项" description="请调整搜索条件后重试" />
        )}
        {emptyNoData && (
          <EmptyState
            title="暂无终端"
            description="点击「新建终端」添加第一个终端，用于社媒发布、API 拉取、浏览器自动化等"
            action={
              <button type="button" className={listPageStyles.primaryBtn} onClick={() => navigate(ROUTES.TENANT.TERMINAL_NEW)}>
                新建终端
              </button>
            }
          />
        )}
        {!emptyNoData && !emptyNoMatch && (
          <>
            <Table
              columns={listColumns}
              dataSource={list}
              rowKey="id"
              loading={loading}
              emptyText="暂无终端"
            />
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
          </>
        )}
      </Card>

      <Card title="执行日志" description="最近执行记录">
        {recentLogs.length === 0 ? (
          <EmptyState title="暂无执行日志" description="终端执行任务后会产生日志记录" />
        ) : (
          <Table columns={logColumns} dataSource={recentLogs} rowKey="id" emptyText="暂无执行日志" />
        )}
      </Card>

      {(deleteTarget || deleteBatch) && (
        <Dialog
          open
          onClose={() => { setDeleteTarget(null); setDeleteBatch(false) }}
          title="删除确认"
          confirmText={deleting ? '删除中…' : '确认删除'}
          onConfirm={deleting ? undefined : confirmDelete}
          onCancel={deleting ? undefined : () => { setDeleteTarget(null); setDeleteBatch(false) }}
        >
          <p style={{ margin: '0 0 16px', fontSize: 14, color: '#3c4043' }}>
            {deleteBatch
              ? `确定要删除已选 ${selectedIds.size} 个终端吗？此操作不可撤销。`
              : `确定要删除「${deleteTarget?.name}」吗？此操作不可撤销。`}
          </p>
        </Dialog>
      )}
    </PageContainer>
  )
}
