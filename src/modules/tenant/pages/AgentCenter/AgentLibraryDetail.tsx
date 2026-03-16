/**
 * 租户 Agent 库详情（只读工作台）
 * 复用平台 AgentTemplate 数据与 Tab 组件，不提供编辑/复制/状态切换
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { getTemplateById } from '@/modules/platform/services/agentTemplateService'
import type { AgentTemplate, AgentTemplateStatus } from '@/modules/platform/schemas/agentTemplate'
import {
  AGENT_CATEGORY_LABELS,
  AGENT_TEMPLATE_STATUS_LABELS,
} from '@/core/labels/agentTemplateLabels'
import { ROUTES } from '@/core/constants/routes'
import { listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import { AgentBasicInfoTab } from '@/modules/platform/pages/AgentFactory/tabs/AgentBasicInfoTab'
import { AgentSkillsTab } from '@/modules/platform/pages/AgentFactory/tabs/AgentSkillsTab'
import styles from '@/modules/platform/pages/AgentFactory/AgentFactoryList.module.css'

const statusMap: Record<AgentTemplateStatus, 'success' | 'warning' | 'error' | 'neutral'> = {
  draft: 'neutral',
  active: 'success',
  inactive: 'warning',
  archived: 'error',
}

type TabKey = 'info' | 'skills'
const TABS: { key: TabKey; label: string }[] = [
  { key: 'info', label: '基础信息' },
  { key: 'skills', label: 'Skills 配置' },
]

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
})

export function AgentLibraryDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [detail, setDetail] = useState<AgentTemplate | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('info')

  useEffect(() => {
    if (!id) return
    getTemplateById(id).then(setDetail)
  }, [id])

  if (!id) { navigate(ROUTES.TENANT.AGENTS); return null }

  if (!detail) {
    return (
      <PageContainer title="Agent 详情">
        <p className={styles.loading}>加载中...</p>
      </PageContainer>
    )
  }

  const displayName = detail.nameZh ?? detail.name

  return (
    <PageContainer title="">
      {/** 返回条 */}
      <div style={backBarStyle}>
        <button
          type="button"
          className={listPageStyles.linkBtn}
          style={{ border: '1px solid #dadce0', borderRadius: 4, padding: '4px 10px' }}
          onClick={() => navigate(ROUTES.TENANT.AGENTS)}
        >
          ← 返回
        </button>
        <span>
          <Link to={ROUTES.TENANT.AGENTS} style={{ color: '#1a73e8', textDecoration: 'none' }}>Agent 中心</Link> / {displayName}
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
            <span><span style={{ fontWeight: 500 }}>创建时间：</span>{detail.createdAt.slice(0, 10)}</span>
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: '#5f6368', padding: '4px 10px', border: '1px solid #dadce0', borderRadius: 4 }}>
            只读（由平台管理员维护）
          </span>
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
      {activeTab === 'skills' && <AgentSkillsTab detail={detail} readonly />}
    </PageContainer>
  )
}
