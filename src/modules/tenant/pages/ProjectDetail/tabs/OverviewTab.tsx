import { useCallback, useState } from 'react'
import { Card } from '@/components/Card/Card'
import { updateProjectSOP } from '@/modules/tenant/services/projectDomainService'
import { Table } from '@/components/Table/Table'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import type { ProjectDetailData } from '../../../schemas/projectDetail'
import type { ProjectResourceType } from '../../../schemas/projectDomain'
import styles from '../tabs.module.css'

const alertLevelMap = {
  info: 'info' as const,
  warning: 'warning' as const,
  error: 'error' as const,
}

const RESOURCE_TYPE_LABELS: Record<ProjectResourceType, string> = {
  identity: '身份',
  terminal: '终端',
  server: '服务',
  api: 'API',
  agentTeam: 'Agent团队',
}

const recentColumns = [
  { key: 'taskName', title: '任务名称', width: '160px' },
  { key: 'status', title: '状态', width: '100px' },
  { key: 'identityName', title: '身份', width: '120px', render: (_: unknown, r: { identityName?: string }) => r.identityName ?? '—' },
  { key: 'updatedAt', title: '更新时间', width: '140px' },
]

function resourceTypeSummary(configs: { resourceType: ProjectResourceType }[]): string {
  if (configs.length === 0) return '—'
  const counts: Record<string, number> = {}
  for (const c of configs) {
    const label = RESOURCE_TYPE_LABELS[c.resourceType] ?? c.resourceType
    counts[label] = (counts[label] ?? 0) + 1
  }
  return Object.entries(counts)
    .map(([label, n]) => `${label} ${n}`)
    .join('、')
}

// ─── 项目级 SOP 内联编辑组件 ──────────────────────────────────────────────────

/**
 * ProjectSOPCard
 * 项目背景 SOP 的展示与内联编辑卡片
 *
 * 功能：
 * - 有 SOP 时：展示 sopRaw 文本 + 「编辑」按钮
 * - 无 SOP 时：展示空状态引导文案 + 「填写 SOP」按钮
 * - 点击编辑 → 进入编辑态（textarea 内联展示，保存/取消按钮）
 * - 保存调用 updateProjectSOP(projectId, sopRaw)
 * - 保存成功后刷新父组件数据（onRefresh 回调）
 *
 * 设计：
 * - 此 SOP 仅作为项目背景描述（替代原创建向导中的 sopRaw 字段）
 * - 不等同于流程规划会话的 sourceText（流程规划时可选择性引用本 SOP）
 */
function ProjectSOPCard({
  projectId,
  sopRaw,
  onRefresh,
}: {
  projectId: string
  sopRaw?: string
  onRefresh?: () => void
}) {
  /** 是否处于编辑态 */
  const [editing, setEditing] = useState(false)
  /** 编辑框内容 */
  const [editValue, setEditValue] = useState(sopRaw ?? '')
  /** 保存中 */
  const [saving, setSaving] = useState(false)
  /** 保存错误 */
  const [saveError, setSaveError] = useState<string | null>(null)

  /**
   * handleEdit
   * 进入编辑态，初始化 editValue 为当前 sopRaw
   */
  const handleEdit = useCallback(() => {
    setEditValue(sopRaw ?? '')
    setEditing(true)
    setSaveError(null)
  }, [sopRaw])

  /**
   * handleCancel
   * 取消编辑，恢复展示态
   */
  const handleCancel = useCallback(() => {
    setEditing(false)
    setSaveError(null)
  }, [])

  /**
   * handleSave
   * 保存 SOP
   * 1. setSaving(true)
   * 2. 调用 updateProjectSOP(projectId, editValue)（service 层，待实现）
   * 3. 成功：退出编辑态，调用 onRefresh?.()
   * 4. 失败：展示 saveError，不退出编辑态
   */
  const handleSave = useCallback(async () => {
    setSaving(true)
    setSaveError(null)
    try {
      await updateProjectSOP(projectId, { sopRaw: editValue })
      setEditing(false)
      onRefresh?.()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }, [projectId, editValue, onRefresh])

  if (editing) {
    return (
      <Card title="项目背景 SOP" description="描述本项目的整体操作方案，供流程规划助手参考">
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          rows={6}
          style={{ width: '100%', boxSizing: 'border-box', padding: 8, fontSize: 13 }}
        />
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <button type="button" className={styles.placeholderBtn} onClick={handleCancel}>
            取消
          </button>
          <button type="button" className={styles.primaryBtn} onClick={handleSave} disabled={saving}>
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
        {saveError && <p style={{ color: 'red', fontSize: 12 }}>{saveError}</p>}
      </Card>
    )
  }

  return (
    <Card title="项目背景 SOP" description="描述本项目的整体操作方案，供流程规划助手参考">
      {sopRaw ? (
        <div>
          {/* 展示态：SOP 文本 + 编辑按钮 */}
          <p style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#333' }}>{sopRaw}</p>
          <button type="button" className={styles.placeholderBtn} onClick={handleEdit}>
            编辑
          </button>
        </div>
      ) : (
        <div>
          <p style={{ color: '#999', fontSize: 13 }}>
            暂无项目背景 SOP。填写后，流程规划助手在创建规划会话时可自动引用。
          </p>
          <button type="button" className={styles.placeholderBtn} onClick={handleEdit}>
            填写 SOP
          </button>
        </div>
      )}
    </Card>
  )
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────

export function OverviewTab({
  data,
  onNavigateToTab,
  onRefresh,
}: {
  data: ProjectDetailData
  onNavigateToTab?: (tab: string) => void
  /** 数据刷新回调（SOP 保存成功后调用） */
  onRefresh?: () => void
}) {
  const { summary, overview, projectGoals = [], projectDeliverables = [], projectResourceConfigs = [], projectSOP } = data
  const projectId = data.summary.id
  const identityCount = summary.identityCount ?? 0
  const defaultIdentityName = summary.defaultIdentityName
  const identityPlatformSummary = summary.identityPlatformSummary

  const goalsCount = projectGoals.length
  const deliverablesCount = projectDeliverables.length
  const resourcesCount = projectResourceConfigs.length
  const resourcesSummary = resourceTypeSummary(projectResourceConfigs)
  const hasSOP = projectSOP != null

  return (
    <>
      <Card title="项目当前状态与关键指标" description="核心信息一览">
        <div className={styles.kvGrid}>
          <span className={styles.kvLabel}>状态</span>
          <span>{summary.status === 'running' ? '进行中' : summary.status === 'paused' ? '已暂停' : summary.status}</span>
          <span className={styles.kvLabel}>目标摘要</span>
          <span>{summary.goalSummary || '—'}</span>
          <span className={styles.kvLabel}>KPI 摘要</span>
          <span>{summary.kpiSummary || '—'}</span>
          <span className={styles.kvLabel}>任务进度</span>
          <span>{summary.taskProgress || '—'}</span>
        </div>
      </Card>
      <Card title="身份摘要" description="本项目绑定的身份与默认身份，用于任务执行时的表达与发布">
        <div className={styles.kvGrid}>
          <span className={styles.kvLabel}>已绑定身份</span>
          <span>{identityCount > 0 ? `${identityCount} 个身份` : '暂无'}</span>
          <span className={styles.kvLabel}>默认身份</span>
          <span>{defaultIdentityName ?? '未设置默认身份'}</span>
          <span className={styles.kvLabel}>适用平台</span>
          <span>{identityPlatformSummary ?? '—'}</span>
        </div>
        {onNavigateToTab && (
          <button type="button" className={styles.placeholderBtn} onClick={() => onNavigateToTab('identities')}>
            前往身份配置
          </button>
        )}
      </Card>
      <Card title="项目定义摘要" description="目标、交付、资源、SOP 是否被明确约束">
        <div className={styles.kvGrid}>
          <span className={styles.kvLabel}>目标</span>
          <span>{goalsCount > 0 ? `共 ${goalsCount} 项目标${projectGoals[0] ? `，首项：${projectGoals[0].goalName}` : ''}` : '暂无'}</span>
          <span className={styles.kvLabel}>交付</span>
          <span>{deliverablesCount > 0 ? `共 ${deliverablesCount} 项交付${projectDeliverables[0] ? `，首项：${projectDeliverables[0].deliverableName}` : ''}` : '暂无'}</span>
          <span className={styles.kvLabel}>资源</span>
          <span>{resourcesCount > 0 ? `${resourcesCount} 项（${resourcesSummary}）` : '暂无'}</span>
          <span className={styles.kvLabel}>SOP</span>
          <span>{hasSOP ? `已配置${projectSOP?.version ? ` v${projectSOP.version}` : ''}` : '未配置'}</span>
        </div>
        {onNavigateToTab && (
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button type="button" className={styles.placeholderBtn} onClick={() => onNavigateToTab('goals')}>
              前往目标与交付
            </button>
            <button type="button" className={styles.placeholderBtn} onClick={() => onNavigateToTab('resources')}>
              前往资源配置
            </button>
            <button type="button" className={styles.placeholderBtn} onClick={() => onNavigateToTab('sop')}>
              前往 SOP
            </button>
          </div>
        )}
      </Card>
      <Card title="最近任务" description="近期更新或执行的任务">
        <Table
          columns={recentColumns}
          dataSource={overview.recentTasks}
          rowKey="id"
          emptyText="暂无最近任务"
        />
      </Card>
      <Card title="预警与待办" description="需关注的任务与终端预警">
        {overview.alerts.length === 0 ? (
          <p className={styles.emptyHint}>暂无预警</p>
        ) : (
          <ul className={styles.alertList}>
            {overview.alerts.map((a) => (
              <li key={a.id}>
                <StatusTag type={alertLevelMap[a.level]}>{a.message}</StatusTag>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/**
       * 项目背景 SOP Card
       * 从创建向导中移出的 sopRaw 字段，在此处供用户随时填写/编辑
       * 保存成功后通过 onRefresh 刷新整个详情页数据
       */}
      <ProjectSOPCard
        projectId={projectId}
        sopRaw={projectSOP?.sopRaw}
        onRefresh={onRefresh}
      />
    </>
  )
}
