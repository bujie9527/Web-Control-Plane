import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { ListPageToolbar, listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import { Table } from '@/components/Table/Table'
import { Pagination } from '@/components/Pagination/Pagination'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { useAuth } from '@/core/auth/AuthContext'
import { Dialog } from '@/components/Dialog/Dialog'
import { getIdentityList, deleteIdentity, createIdentity, updateIdentity } from '../services/identityService'
import type { Identity, IdentityStatus, IdentityType } from '../schemas/identity'
import { ROUTES } from '@/core/constants/routes'

const PLATFORM_LABELS: Record<string, string> = {
  wechat: '微信',
  x: 'X',
  tiktok: '抖音',
  douyin: '抖音',
  xiaohongshu: '小红书',
  weibo: '微博',
}

function getPlatformLabels(adaptations: Record<string, string>): string {
  const keys = Object.keys(adaptations || {}).filter(Boolean)
  return keys.map((k) => PLATFORM_LABELS[k] ?? k).join('、') || '—'
}

const statusMap: Record<IdentityStatus, 'success' | 'warning' | 'error' | 'neutral'> = {
  draft: 'neutral',
  active: 'success',
  archived: 'neutral',
}

const statusLabel: Record<IdentityStatus, string> = {
  draft: '草稿',
  active: '启用',
  archived: '已归档',
}

const typeLabel: Record<IdentityType, string> = {
  brand_official: '品牌官号',
  koc: 'KOC',
  expert: '专家',
  assistant: '助手',
  other: '其他',
}

export function IdentityList() {
  const { user } = useAuth()
  const tenantId = user?.tenant?.tenantId ?? ''
  const navigate = useNavigate()
  const [list, setList] = useState<Identity[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<IdentityStatus | ''>('')
  const [typeFilter, setTypeFilter] = useState<IdentityType | ''>('')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')

  type EditMode = 'create' | 'edit'
  const [editMode, setEditMode] = useState<EditMode>('create')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState<{
    name: string
    type: IdentityType
    corePositioning: string
    toneStyle: string
    contentDirections: string
    behaviorRules: string
  }>({
    name: '',
    type: 'other',
    corePositioning: '',
    toneStyle: '',
    contentDirections: '',
    behaviorRules: '',
  })

  const load = useCallback(async () => {
    if (!tenantId) {
      setList([])
      setTotal(0)
      return
    }
    setLoading(true)
    try {
      const res = await getIdentityList({
        tenantId,
        page,
        pageSize,
        keyword: keyword.trim() || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      })
      setList(res.items)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [tenantId, page, pageSize, keyword, statusFilter, typeFilter])

  useEffect(() => {
    load()
  }, [load])

  const openCreateDialog = () => {
    setEditMode('create')
    setEditingId(null)
    setFormError('')
    setForm({
      name: '',
      type: 'other',
      corePositioning: '',
      toneStyle: '',
      contentDirections: '',
      behaviorRules: '',
    })
    setDialogOpen(true)
  }

  const openEditDialog = (identity: Identity) => {
    setEditMode('edit')
    setEditingId(identity.id)
    setFormError('')
    setForm({
      name: identity.name,
      type: identity.type,
      corePositioning: identity.corePositioning,
      toneStyle: identity.toneStyle,
      contentDirections: identity.contentDirections,
      behaviorRules: identity.behaviorRules,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!tenantId) {
      setFormError('当前租户信息缺失，无法保存身份')
      return
    }
    if (!form.name.trim()) {
      setFormError('请填写身份名称')
      return
    }
    setSaving(true)
    try {
      if (editMode === 'create') {
        await createIdentity({
          tenantId,
          name: form.name.trim(),
          type: form.type,
          corePositioning: form.corePositioning.trim(),
          toneStyle: form.toneStyle.trim(),
          contentDirections: form.contentDirections.trim(),
          behaviorRules: form.behaviorRules.trim(),
        })
        setNotice('已创建身份')
      } else if (editingId) {
        await updateIdentity(editingId, {
          name: form.name.trim(),
          type: form.type,
          corePositioning: form.corePositioning.trim(),
          toneStyle: form.toneStyle.trim(),
          contentDirections: form.contentDirections.trim(),
          behaviorRules: form.behaviorRules.trim(),
        })
        setNotice('已更新身份')
      }
      setDialogOpen(false)
      load()
      window.setTimeout(() => setNotice(''), 2500)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : '保存失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (r: Identity) => {
    const ok = window.confirm(`确认删除身份「${r.name}」吗？删除后无法恢复。`)
    if (!ok) return
    try {
      await deleteIdentity(r.id)
      setNotice('已删除该身份')
      window.setTimeout(() => setNotice(''), 2500)
      load()
    } catch (e) {
      setNotice(e instanceof Error ? e.message : '删除失败')
      window.setTimeout(() => setNotice(''), 2500)
    }
  }

  const columns = [
    { key: 'name', title: '身份名称', width: '140px' },
    {
      key: 'type',
      title: '身份类型',
      width: '100px',
      render: (_: unknown, r: Identity) => typeLabel[r.type],
    },
    {
      key: 'corePositioning',
      title: '核心定位',
      width: '200px',
      render: (_: unknown, r: Identity) => (r.corePositioning ? (r.corePositioning.length > 24 ? `${r.corePositioning.slice(0, 24)}…` : r.corePositioning) : '—'),
    },
    {
      key: 'platforms',
      title: '适用平台',
      width: '120px',
      render: (_: unknown, r: Identity) => getPlatformLabels(r.platformAdaptations),
    },
    {
      key: 'status',
      title: '状态',
      width: '80px',
      render: (_: unknown, r: Identity) => (
        <StatusTag type={statusMap[r.status]}>{statusLabel[r.status]}</StatusTag>
      ),
    },
    {
      key: 'updatedAt',
      title: '更新时间',
      width: '110px',
      render: (_: unknown, r: Identity) => r.updatedAt.slice(0, 10),
    },
    {
      key: 'action',
      title: '操作',
      width: '160px',
      render: (_: unknown, r: Identity) => (
        <div className={listPageStyles.actions}>
          <button
            type="button"
            className={listPageStyles.linkBtn}
            onClick={() => navigate(`${ROUTES.TENANT.IDENTITIES}/${r.id}`)}
          >
            查看
          </button>
          <button
            type="button"
            className={listPageStyles.linkBtn}
            onClick={() => openEditDialog(r)}
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
      title="身份库"
      description="管理可复用的身份/人设，用于统一表达口径与项目、任务、终端绑定"
    >
      {notice && <p style={{ padding: '8px 16px', margin: '0 0 8px', background: '#fff3cd', color: '#856404', borderRadius: 4, fontSize: 14 }}>{notice}</p>}
      <ListPageToolbar
        primaryAction={
          <button type="button" className={listPageStyles.primaryBtn} onClick={openCreateDialog}>
            新建身份
          </button>
        }
      >
        <input
          type="text"
          className={listPageStyles.search}
          placeholder="搜索身份名称、核心定位"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <select
          className={listPageStyles.select}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as IdentityStatus | '')}
        >
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="active">启用</option>
          <option value="archived">已归档</option>
        </select>
        <select
          className={listPageStyles.select}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as IdentityType | '')}
        >
          <option value="">全部类型</option>
          <option value="brand_official">品牌官号</option>
          <option value="koc">KOC</option>
          <option value="expert">专家</option>
          <option value="assistant">助手</option>
          <option value="other">其他</option>
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
        emptyText="暂无身份数据"
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
      {dialogOpen && (
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title={editMode === 'create' ? '新建身份' : '编辑身份'}
          confirmText={saving ? '保存中…' : '保存'}
          onConfirm={saving ? undefined : handleSave}
          onCancel={saving ? undefined : () => setDialogOpen(false)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {formError && (
              <p style={{ color: '#d93025', fontSize: 13, margin: 0 }}>{formError}</p>
            )}
            <label className={listPageStyles.formLabel}>
              身份名称
              <input
                type="text"
                className={listPageStyles.search}
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="请输入身份名称"
              />
            </label>
            <label className={listPageStyles.formLabel}>
              身份类型
              <select
                className={listPageStyles.select}
                value={form.type}
                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as IdentityType }))}
              >
                <option value="brand_official">品牌官号</option>
                <option value="koc">KOC</option>
                <option value="expert">专家</option>
                <option value="assistant">助手</option>
                <option value="other">其他</option>
              </select>
            </label>
            <label className={listPageStyles.formLabel}>
              核心定位
              <textarea
                className={listPageStyles.textarea}
                rows={3}
                value={form.corePositioning}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, corePositioning: e.target.value }))
                }
                placeholder="简要描述该身份的核心定位"
              />
            </label>
            <label className={listPageStyles.formLabel}>
              语气风格
              <input
                type="text"
                className={listPageStyles.search}
                value={form.toneStyle}
                onChange={(e) => setForm((prev) => ({ ...prev, toneStyle: e.target.value }))}
                placeholder="如：专业、亲切、有趣"
              />
            </label>
            <label className={listPageStyles.formLabel}>
              内容方向
              <textarea
                className={listPageStyles.textarea}
                rows={3}
                value={form.contentDirections}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, contentDirections: e.target.value }))
                }
                placeholder="可选，说明该身份适合产出的内容类型"
              />
            </label>
            <label className={listPageStyles.formLabel}>
              行为规则
              <textarea
                className={listPageStyles.textarea}
                rows={3}
                value={form.behaviorRules}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, behaviorRules: e.target.value }))
                }
                placeholder="可选，约束该身份在各渠道的行为边界"
              />
            </label>
          </div>
        </Dialog>
      )}
    </PageContainer>
  )
}
