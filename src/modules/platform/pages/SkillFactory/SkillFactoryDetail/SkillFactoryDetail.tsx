import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { Dialog } from '@/components/Dialog/Dialog'
import { getSkillById, changeSkillStatus, deleteSkill } from '@/modules/platform/services/skillService'
import type { Skill, SkillStatus } from '@/modules/platform/schemas/skill'
import {
  SKILL_STATUS_LABELS,
  SKILL_CATEGORY_LABELS,
  SKILL_EXECUTION_TYPE_LABELS,
} from '@/core/labels/skillLabels'
import { ROUTES } from '@/core/constants/routes'
import { listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import { OverviewTab } from './tabs/OverviewTab'
import { OpenClawSpecTab } from './tabs/OpenClawSpecTab'
import { AgentBindingsTab } from './tabs/AgentBindingsTab'
import styles from '../SkillFactory.module.css'

const statusTagMap: Record<SkillStatus, 'success' | 'warning'> = {
  active: 'success',
  inactive: 'warning',
}

type TabKey = 'overview' | 'openclaw' | 'agents'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: '基础信息' },
  { key: 'openclaw', label: 'OpenClaw 结构' },
  { key: 'agents', label: '绑定 Agent' },
]

export function SkillFactoryDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [skill, setSkill] = useState<Skill | null | undefined>(undefined)
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [notice, setNotice] = useState('')

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [statusNew, setStatusNew] = useState<SkillStatus>('active')
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusError, setStatusError] = useState('')

  const showNotice = (msg: string) => {
    setNotice(msg)
    window.setTimeout(() => setNotice(''), 2500)
  }

  useEffect(() => {
    if (!id) return
    getSkillById(id).then(setSkill)
  }, [id])

  if (!id) {
    navigate(ROUTES.SYSTEM.SKILL_FACTORY)
    return null
  }

  if (skill === undefined) {
    return (
      <PageContainer title="Skill 详情">
        <p className={styles.loading}>加载中...</p>
      </PageContainer>
    )
  }

  if (skill === null) {
    return (
      <PageContainer title="Skill 详情">
        <p className={styles.loading}>未找到该 Skill。</p>
        <Link to={ROUTES.SYSTEM.SKILL_FACTORY}>← 返回 Skill 工厂</Link>
      </PageContainer>
    )
  }

  const handleDeleteConfirm = async () => {
    setDeleting(true)
    try {
      const res = await deleteSkill(id)
      if (!res.success) {
        const msg = (res as { messageZh?: string }).messageZh ?? (res.reason === 'SYSTEM_BUILT_IN' ? '系统内置 Skill 不可删除' : '删除失败')
        showNotice(msg)
        setDeleteOpen(false)
      } else {
        navigate(ROUTES.SYSTEM.SKILL_FACTORY)
      }
    } catch {
      showNotice('删除失败，请重试')
      setDeleteOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  const openStatusDialog = () => {
    setStatusNew(skill.status)
    setStatusError('')
    setStatusDialogOpen(true)
  }

  const handleStatusSubmit = async () => {
    setStatusSaving(true)
    setStatusError('')
    try {
      const updated = await changeSkillStatus(id, statusNew)
      if (updated) setSkill(updated)
      setStatusDialogOpen(false)
      showNotice('状态已更新')
    } catch (e) {
      setStatusError(e instanceof Error ? e.message : '操作失败')
    } finally {
      setStatusSaving(false)
    }
  }

  return (
    <PageContainer title="">
      {notice && <p className={styles.notice}>{notice}</p>}

      {/** 返回条 */}
      <div className={styles.backBar}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate(ROUTES.SYSTEM.SKILL_FACTORY)}
        >
          ← 返回
        </button>
        <span className={styles.breadcrumb}>
          系统管理 / <Link to={ROUTES.SYSTEM.SKILL_FACTORY}>Skill 工厂</Link> / {skill.nameZh ?? skill.name}
        </span>
      </div>

      {/** 摘要条 */}
      <div className={styles.summaryBar}>
        <div className={styles.summaryLeft}>
          <div className={styles.summaryTitle}>
            <h2 className={styles.summaryName}>{skill.nameZh ?? skill.name}</h2>
            <StatusTag type={statusTagMap[skill.status]}>
              {SKILL_STATUS_LABELS[skill.status]}
            </StatusTag>
          </div>
          <div className={styles.summaryMeta}>
            <span className={styles.summaryMetaItem}>
              <span className={styles.summaryMetaLabel}>分类：</span>
              <span className={styles.summaryMetaValue}>
                {SKILL_CATEGORY_LABELS[skill.category] ?? skill.category}
              </span>
            </span>
            <span className={styles.summaryMetaItem}>
              <span className={styles.summaryMetaLabel}>执行类型：</span>
              <span className={styles.summaryMetaValue}>
                {SKILL_EXECUTION_TYPE_LABELS[skill.executionType]}
              </span>
            </span>
            <span className={styles.summaryMetaItem}>
              <span className={styles.summaryMetaLabel}>绑定 Agent 数：</span>
              <span className={styles.summaryMetaValue}>
                {skill.boundAgentTemplateIds?.length ?? 0}
              </span>
            </span>
            <span className={styles.summaryMetaItem}>
              <span className={styles.summaryMetaLabel}>系统预置：</span>
              <span className={styles.summaryMetaValue}>{skill.isSystemPreset ? '是' : '否'}</span>
            </span>
            <span className={styles.summaryMetaItem}>
              <span className={styles.summaryMetaLabel}>创建时间：</span>
              <span className={styles.summaryMetaValue}>{skill.createdAt.slice(0, 10)}</span>
            </span>
          </div>
        </div>
        <div className={styles.summaryActions}>
          <button
            type="button"
            className={listPageStyles.primaryBtn}
            onClick={() => navigate(ROUTES.SYSTEM.SKILL_FACTORY_EDIT(id))}
          >
            编辑
          </button>
          <button
            type="button"
            className={listPageStyles.linkBtn}
            onClick={openStatusDialog}
          >
            {skill.status === 'active' ? '停用' : '启用'}
          </button>
          {!skill.isSystemPreset && (
            <button
              type="button"
              className={styles.dangerBtn}
              onClick={() => setDeleteOpen(true)}
            >
              删除
            </button>
          )}
        </div>
      </div>

      {/** Tab 导航 */}
      <div className={styles.tabNav}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`${styles.tabItem} ${activeTab === tab.key ? styles.tabItemActive : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/** Tab 内容区 */}
      {activeTab === 'overview' && <OverviewTab skill={skill} />}
      {activeTab === 'openclaw' && <OpenClawSpecTab skill={skill} />}
      {activeTab === 'agents' && <AgentBindingsTab skill={skill} />}

      {/** 删除确认 */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
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
              onClick={() => setDeleteOpen(false)}
            >
              取消
            </button>
          </div>
        }
      >
        <p className={styles.confirmText}>
          确定要删除「{skill.nameZh ?? skill.name}」吗？此操作不可撤销。
        </p>
      </Dialog>

      {/** 修改状态 */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
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
              onClick={() => setStatusDialogOpen(false)}
            >
              取消
            </button>
          </div>
        }
      >
        {statusError && <p className={styles.errorText}>{statusError}</p>}
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
