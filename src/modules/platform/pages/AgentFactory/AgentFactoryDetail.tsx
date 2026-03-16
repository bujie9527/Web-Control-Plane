import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { Dialog } from '@/components/Dialog/Dialog'
import {
  getTemplateById,
  getAgentTemplateReferences,
  changeStatus,
  deleteTemplate,
  cloneTemplate,
} from '../../services/agentTemplateService'
import type { AgentTemplate, AgentTemplateStatus, CloneAgentTemplatePayload } from '../../schemas/agentTemplate'
import {
  AGENT_CATEGORY_LABELS,
  AGENT_TEMPLATE_STATUS_LABELS,
} from '@/core/labels/agentTemplateLabels'
import { ROUTES } from '@/core/constants/routes'
import { listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import { CopyTemplateDialog } from './CopyTemplateDialog'
import { AgentBasicInfoTab } from './tabs/AgentBasicInfoTab'
import { AgentSkillsTab } from './tabs/AgentSkillsTab'
import { AgentReferencesTab } from './tabs/AgentReferencesTab'
import { AgentDebugTab } from './tabs/AgentDebugTab'
import styles from './AgentFactoryList.module.css'

const statusMap: Record<AgentTemplateStatus, 'success' | 'warning' | 'error' | 'neutral'> = {
  draft: 'neutral',
  active: 'success',
  inactive: 'warning',
  archived: 'error',
}

type TabKey = 'info' | 'skills' | 'references' | 'debug'
const TABS: { key: TabKey; label: string }[] = [
  { key: 'info', label: '基础信息' },
  { key: 'skills', label: 'Skills 配置' },
  { key: 'references', label: '引用关系' },
  { key: 'debug', label: '调试模式' },
]

const tabNavStyle: React.CSSProperties = {
  display: 'flex',
  borderBottom: '2px solid #e8eaed',
  marginBottom: 20,
}

const getTabItemStyle = (active: boolean): React.CSSProperties => ({
  padding: '10px 20px',
  fontSize: 14,
  color: active ? '#1a73e8' : '#5f6368',
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  borderBottom: active ? '2px solid #1a73e8' : '2px solid transparent',
  marginBottom: -2,
  fontWeight: active ? 500 : 400,
  transition: 'color 0.15s',
})

const backBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 0 12px',
  fontSize: 13,
  color: '#5f6368',
}

const summaryBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  padding: '16px 0 20px',
  borderBottom: '1px solid #e8eaed',
  marginBottom: 16,
  gap: 16,
  flexWrap: 'wrap',
}

export function AgentFactoryDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [detail, setDetail] = useState<AgentTemplate | null>(null)
  const [refs, setRefs] = useState<Awaited<ReturnType<typeof getAgentTemplateReferences>> | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('info')
  const [notice, setNotice] = useState('')

  const [copyDialogOpen, setCopyDialogOpen] = useState(false)

  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [statusNew, setStatusNew] = useState<AgentTemplateStatus>('active')
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusError, setStatusError] = useState('')

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const showNotice = (msg: string) => {
    setNotice(msg)
    window.setTimeout(() => setNotice(''), 2500)
  }

  useEffect(() => {
    if (!id) return
    getTemplateById(id).then(setDetail)
    getAgentTemplateReferences(id).then(setRefs)
  }, [id])

  const handleCopyConfirm = async (payload: CloneAgentTemplatePayload) => {
    if (!id) return
    const created = await cloneTemplate(id, payload)
    setCopyDialogOpen(false)
    if (created) navigate(ROUTES.SYSTEM.AGENT_FACTORY_DETAIL(created.id))
  }

  const openStatusDialog = () => {
    if (!detail) return
    setStatusNew(detail.status)
    setStatusError('')
    setStatusDialogOpen(true)
  }

  const handleStatusSubmit = async () => {
    if (!id) return
    setStatusSaving(true)
    setStatusError('')
    try {
      await changeStatus(id, statusNew)
      setDetail((prev) => prev ? { ...prev, status: statusNew } : prev)
      setStatusDialogOpen(false)
      showNotice('状态已更新')
    } catch (e) {
      setStatusError(e instanceof Error ? e.message : '操作失败')
    } finally {
      setStatusSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id || !detail) return
    const refCount = (refs?.workflowTemplateNodes.length ?? 0) + (refs?.workflowPlanningDraftNodes.length ?? 0)
    if (refCount > 0) {
      showNotice(`该模板仍被 ${refCount} 个流程节点引用，无法删除`)
      setDeleteOpen(false)
      return
    }
    setDeleting(true)
    try {
      const res = await deleteTemplate(id)
      if (!res.success) {
        showNotice(res.reason === 'SYSTEM_BUILT_IN' ? '系统内置模板不可删除' : '删除失败')
        setDeleteOpen(false)
      } else {
        navigate(ROUTES.SYSTEM.AGENT_FACTORY)
      }
    } catch {
      showNotice('删除失败，请重试')
      setDeleteOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  if (!id) { navigate(ROUTES.SYSTEM.AGENT_FACTORY); return null }

  if (!detail) {
    return (
      <PageContainer title="Agent 模板详情">
        <p className={styles.loading}>加载中...</p>
      </PageContainer>
    )
  }

  const displayName = detail.nameZh ?? detail.name

  return (
    <PageContainer title="">
      {notice && <p style={{ padding: '8px 16px', margin: '0 0 8px', background: '#fff3cd', color: '#856404', borderRadius: 4, fontSize: 14 }}>{notice}</p>}

      {/** 返回条 */}
      <div style={backBarStyle}>
        <button
          type="button"
          className={listPageStyles.linkBtn}
          style={{ border: '1px solid #dadce0', borderRadius: 4, padding: '4px 10px' }}
          onClick={() => navigate(ROUTES.SYSTEM.AGENT_FACTORY)}
        >
          ← 返回
        </button>
        <span>
          系统管理 / <Link to={ROUTES.SYSTEM.AGENT_FACTORY} style={{ color: '#1a73e8', textDecoration: 'none' }}>Agent 模板工厂</Link> / {displayName}
        </span>
      </div>

      {/** 摘要条 */}
      <div style={summaryBarStyle}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: '#202124', margin: 0 }}>{displayName}</h2>
            <StatusTag type={statusMap[detail.status]}>
              {AGENT_TEMPLATE_STATUS_LABELS[detail.status]}
            </StatusTag>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#5f6368' }}>
            <span><span style={{ fontWeight: 500 }}>分类：</span>{AGENT_CATEGORY_LABELS[detail.category ?? ''] ?? detail.category ?? '—'}</span>
            <span><span style={{ fontWeight: 500 }}>编码：</span>{detail.code}</span>
            <span><span style={{ fontWeight: 500 }}>版本：</span>{detail.version ?? '—'}</span>
            <span><span style={{ fontWeight: 500 }}>系统预置：</span>{detail.isSystemPreset ? '是' : '否'}</span>
            <span><span style={{ fontWeight: 500 }}>创建时间：</span>{detail.createdAt.slice(0, 10)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button type="button" className={listPageStyles.primaryBtn} onClick={() => navigate(ROUTES.SYSTEM.AGENT_FACTORY_EDIT(id))}>
            编辑
          </button>
          {detail.isCloneable && (
            <button type="button" className={listPageStyles.linkBtn} onClick={() => setCopyDialogOpen(true)}>
              复制
            </button>
          )}
          <button type="button" className={listPageStyles.linkBtn} onClick={openStatusDialog}>
            修改状态
          </button>
          {!detail.isSystemPreset && (
            <button
              type="button"
              style={{ padding: '7px 14px', fontSize: 13, background: '#d93025', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
              onClick={() => setDeleteOpen(true)}
            >
              删除
            </button>
          )}
        </div>
      </div>

      {/** Tab 导航 */}
      <div style={tabNavStyle}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            style={getTabItemStyle(activeTab === tab.key)}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/** Tab 内容 */}
      {activeTab === 'info' && <AgentBasicInfoTab detail={detail} />}
      {activeTab === 'skills' && <AgentSkillsTab detail={detail} />}
      {activeTab === 'references' && <AgentReferencesTab refs={refs} />}
      {activeTab === 'debug' && <AgentDebugTab detail={detail} />}

      {/** 状态修改 */}
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
        <p className={styles.statusTarget}>模板：{displayName}</p>
        <div className={styles.formRow}>
          <label>新状态</label>
          <select value={statusNew} onChange={(e) => setStatusNew(e.target.value as AgentTemplateStatus)}>
            <option value="draft">草稿</option>
            <option value="active">已发布</option>
            <option value="inactive">已停用</option>
            <option value="archived">已归档</option>
          </select>
        </div>
      </Dialog>

      {/** 删除确认 */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="删除确认"
        width={400}
        footer={
          <div className={styles.formActions}>
            <button
              type="button"
              style={{ padding: '7px 20px', fontSize: 14, background: '#d93025', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', opacity: deleting ? 0.6 : 1 }}
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? '删除中...' : '确认删除'}
            </button>
            <button type="button" className={listPageStyles.linkBtn} onClick={() => setDeleteOpen(false)}>
              取消
            </button>
          </div>
        }
      >
        <p className={styles.statusTarget}>确定要删除「{displayName}」吗？此操作不可撤销。</p>
      </Dialog>

      {copyDialogOpen && detail.isCloneable && (
        <CopyTemplateDialog
          key={detail.id}
          open={copyDialogOpen}
          onClose={() => setCopyDialogOpen(false)}
          source={detail}
          onConfirm={handleCopyConfirm}
        />
      )}
    </PageContainer>
  )
}
