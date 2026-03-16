import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { ListPageToolbar, listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import { Table } from '@/components/Table/Table'
import { Pagination } from '@/components/Pagination/Pagination'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { Dialog } from '@/components/Dialog/Dialog'
import { getProjectList, deleteProject, updateProject } from '../services/projectService'
import type { Project, ProjectStatus } from '../schemas/project'
import { ROUTES } from '@/core/constants/routes'

const statusMap: Record<ProjectStatus, 'success' | 'warning' | 'error' | 'neutral'> = {
  draft: 'neutral',
  running: 'success',
  paused: 'warning',
  archived: 'neutral',
}

const statusLabel: Record<ProjectStatus, string> = {
  draft: '草稿',
  running: '进行中',
  paused: '已暂停',
  archived: '已归档',
}

export function ProjectList() {
  const navigate = useNavigate()
  const [list, setList] = useState<Project[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>('')
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStatus, setEditStatus] = useState<ProjectStatus>('draft')
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getProjectList({
        page,
        pageSize,
        keyword: keyword.trim() || undefined,
        status: statusFilter || undefined,
      })
      setList(res.items)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, keyword, statusFilter])

  const [notice, setNotice] = useState('')

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async (r: Project) => {
    const ok = window.confirm(`确认删除项目「${r.name}」吗？删除后无法恢复。`)
    if (!ok) return
    try {
      await deleteProject(r.id)
      setNotice('已删除该项目')
      window.setTimeout(() => setNotice(''), 2500)
      load()
    } catch (e) {
      setNotice(e instanceof Error ? e.message : '删除失败')
      window.setTimeout(() => setNotice(''), 2500)
    }
  }

  const openEdit = (r: Project) => {
    setEditing(r)
    setEditName(r.name)
    setEditDescription(r.description ?? '')
    setEditStatus(r.status)
    setEditError('')
  }

  const handleEditSave = async () => {
    if (!editing) return
    if (!editName.trim()) {
      setEditError('请填写项目名称')
      return
    }
    setEditSaving(true)
    try {
      await updateProject(editing.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        status: editStatus,
      })
      setNotice('已更新项目')
      setEditing(null)
      load()
      window.setTimeout(() => setNotice(''), 2500)
    } catch (e) {
      setEditError(e instanceof Error ? e.message : '保存失败，请稍后重试')
    } finally {
      setEditSaving(false)
    }
  }

  const columns = [
    { key: 'name', title: '项目名称', width: '160px' },
    { key: 'channel', title: '所属渠道', width: '100px' },
    { key: 'ownerName', title: '负责人', width: '90px' },
    {
      key: 'goalSummary',
      title: '当前目标',
      width: '180px',
      render: (_: unknown, r: Project) => r.goalSummary || '—',
    },
    {
      key: 'status',
      title: '当前状态',
      width: '90px',
      render: (_: unknown, r: Project) => (
        <StatusTag type={statusMap[r.status]}>{statusLabel[r.status]}</StatusTag>
      ),
    },
    { key: 'agentTeamName', title: '绑定 Agent Team', width: '120px' },
    { key: 'terminalCount', title: '绑定终端数', width: '100px' },
    { key: 'taskProgress', title: '任务进度', width: '90px' },
    {
      key: 'updatedAt',
      title: '更新时间',
      width: '110px',
      render: (_: unknown, r: Project) => r.updatedAt.slice(0, 10),
    },
    {
      key: 'action',
      title: '操作',
      width: '160px',
      render: (_: unknown, r: Project) => (
        <div className={listPageStyles.actions}>
          <button
            type="button"
            className={listPageStyles.linkBtn}
            onClick={() => navigate(`${ROUTES.TENANT.PROJECTS}/${r.id}`)}
          >
            查看
          </button>
          <button
            type="button"
            className={listPageStyles.linkBtn}
            onClick={() => openEdit(r)}
          >
            编辑
          </button>
          <button
            type="button"
            className={listPageStyles.linkBtn}
            onClick={() => handleDelete(r)}
          >
            删除
          </button>
        </div>
      ),
    },
  ]

  return (
    <PageContainer
      title="项目中心"
      description="管理当前租户下的业务项目与执行资源"
    >
      {notice && <p style={{ padding: '8px 16px', margin: '0 0 8px', background: '#fff3cd', color: '#856404', borderRadius: 4, fontSize: 14 }}>{notice}</p>}
      <ListPageToolbar
        primaryAction={
          <button
            type="button"
            className={listPageStyles.primaryBtn}
            onClick={() => navigate(ROUTES.TENANT.PROJECT_CREATE)}
          >
            新建项目
          </button>
        }
      >
        <input
          type="text"
          className={listPageStyles.search}
          placeholder="搜索项目名称"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <select
          className={listPageStyles.select}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | '')}
        >
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="running">进行中</option>
          <option value="paused">已暂停</option>
          <option value="archived">已归档</option>
        </select>
        <button type="button" className={listPageStyles.queryBtn} onClick={() => setPage(1)}>
          查询
        </button>
      </ListPageToolbar>
      <Table
        columns={columns}
        dataSource={list}
        rowKey="id"
        loading={loading}
        emptyText="暂无项目数据"
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
      {editing && (
        <Dialog
          open={!!editing}
          onClose={() => setEditing(null)}
          title="编辑项目"
          confirmText={editSaving ? '保存中…' : '保存'}
          onConfirm={editSaving ? undefined : handleEditSave}
          onCancel={editSaving ? undefined : () => setEditing(null)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {editError && (
              <p style={{ color: '#d93025', fontSize: 13, margin: 0 }}>{editError}</p>
            )}
            <label className={listPageStyles.formLabel}>
              项目名称
              <input
                type="text"
                className={listPageStyles.search}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </label>
            <label className={listPageStyles.formLabel}>
              描述
              <textarea
                className={listPageStyles.textarea}
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </label>
            <label className={listPageStyles.formLabel}>
              状态
              <select
                className={listPageStyles.select}
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
              >
                <option value="draft">草稿</option>
                <option value="running">进行中</option>
                <option value="paused">已暂停</option>
                <option value="archived">已归档</option>
              </select>
            </label>
          </div>
        </Dialog>
      )}
    </PageContainer>
  )
}
