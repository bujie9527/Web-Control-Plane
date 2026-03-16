import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { fetchProjectDetailWorkbench } from '../../services/projectDetailService'
import type { ProjectDetailData } from '../../schemas/projectDetail'
import type { ProjectStatus } from '../../schemas/project'
import { ROUTES } from '@/core/constants/routes'
import { OverviewTab } from './tabs/OverviewTab'
import { GoalsKpiTab } from './tabs/GoalsKpiTab'
import { ChannelsTab } from './tabs/ChannelsTab'
import { AgentTeamTab } from './tabs/AgentTeamTab'
import { IdentityConfigTab } from './tabs/IdentityConfigTab'
import { TerminalsTab } from './tabs/TerminalsTab'
import { ProjectResourcesTab } from './tabs/ProjectResourcesTab'
import { WorkflowTasksTab } from './tabs/WorkflowTasksTab'
import { ResultsTab } from './tabs/ResultsTab'
import { ProjectSOPTab } from './tabs/ProjectSOPTab'
import { SettingsTab } from './tabs/SettingsTab'
import styles from './ProjectDetailWorkbench.module.css'

/** 与项目创建向导顺序基本一致：概览→目标→流程与任务→Agent→身份/渠道/资源→结果→SOP→设置 */
const TAB_KEYS = ['overview', 'goals', 'workflowTasks', 'agentTeam', 'channels', 'identities', 'terminals', 'resources', 'results', 'sop', 'settings'] as const
type TabKey = (typeof TAB_KEYS)[number]

const TAB_LABELS: Record<TabKey, string> = {
  overview: '概览',
  goals: '目标与交付',
  channels: '渠道配置',
  agentTeam: 'Agent团队',
  identities: '身份配置',
  terminals: '终端分配',
  resources: '资源配置',
  workflowTasks: '流程与任务',
  results: '结果反馈',
  sop: 'SOP',
  settings: '项目设置',
}

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

export function ProjectDetailWorkbench() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<ProjectDetailData | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('overview')

  useEffect(() => {
    if (!id) return
    fetchProjectDetailWorkbench(id).then(setData)
  }, [id])

  if (!id) {
    navigate(ROUTES.TENANT.PROJECTS)
    return null
  }

  if (!data) {
    return (
      <PageContainer title="项目详情" description="加载中...">
        <p className={styles.loading}>加载中...</p>
      </PageContainer>
    )
  }

  const s = data.summary
  const periodStr = s.startDate && s.endDate ? `${s.startDate} ～ ${s.endDate}` : '—'

  return (
    <PageContainer
      title={s.name}
      description={s.description ? `${s.description} · 目标驱动流程，流程通过 Agent 与终端执行，结果回馈 KPI。` : '目标驱动流程，流程通过 Agent 与终端执行，结果回馈 KPI。'}
    >
      <div className={styles.backBar}>
        <Link to={ROUTES.TENANT.PROJECTS} className={styles.backLink}>
          ← 返回项目列表
        </Link>
      </div>

      <div className={styles.summary}>
        <StatusTag type={statusMap[s.status]}>{statusLabel[s.status]}</StatusTag>
        <span className={styles.summaryItem}><span className={styles.summaryLabel}>负责人</span> {s.ownerName ?? '—'}</span>
        <span className={styles.summaryItem}><span className={styles.summaryLabel}>周期</span> {periodStr}</span>
        <span className={styles.summaryItem}><span className={styles.summaryLabel}>渠道数</span> {s.channelCount ?? 0}</span>
        <span className={styles.summaryItem}><span className={styles.summaryLabel}>Agent Team</span> {s.agentTeamName ?? '未绑定'}</span>
        <span className={styles.summaryItem}><span className={styles.summaryLabel}>身份数</span> {s.identityCount ?? 0}</span>
        <span className={styles.summaryItem}><span className={styles.summaryLabel}>默认身份</span> {s.defaultIdentityName ?? '未设置'}</span>
        <span className={styles.summaryItem}><span className={styles.summaryLabel}>终端数</span> {s.terminalCount ?? 0}</span>
        <span className={styles.summaryItem}><span className={styles.summaryLabel}>任务</span> {s.taskSummary ?? '—'}</span>
        <span className={styles.summaryItem}><span className={styles.summaryLabel}>KPI</span> {s.kpiSummary ?? '—'}</span>
      </div>

      <nav className={styles.tabNav} aria-label="页内导航">
        {TAB_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className={activeTab === key ? `${styles.tabBtn} ${styles.tabBtnActive}` : styles.tabBtn}
            onClick={() => setActiveTab(key)}
          >
            {TAB_LABELS[key]}
          </button>
        ))}
      </nav>

      <div className={styles.content}>
        {activeTab === 'overview' && (
          <OverviewTab
            data={data}
            onNavigateToTab={(key) => setActiveTab(key as TabKey)}
            onRefresh={() => fetchProjectDetailWorkbench(id).then(setData)}
          />
        )}
        {activeTab === 'goals' && <GoalsKpiTab data={data} />}
        {activeTab === 'channels' && <ChannelsTab data={data} />}
        {activeTab === 'agentTeam' && <AgentTeamTab data={data} projectId={id} />}
        {activeTab === 'identities' && <IdentityConfigTab data={data} />}
        {activeTab === 'terminals' && <TerminalsTab data={data} />}
        {activeTab === 'resources' && <ProjectResourcesTab data={data} />}
        {activeTab === 'workflowTasks' && (
          <WorkflowTasksTab
            data={data}
            projectId={id}
            onRefresh={() => fetchProjectDetailWorkbench(id).then(setData)}
          />
        )}
        {activeTab === 'results' && <ResultsTab data={data} />}
        {activeTab === 'sop' && <ProjectSOPTab data={data} />}
        {activeTab === 'settings' && <SettingsTab data={data} />}
      </div>
    </PageContainer>
  )
}
