import { useCallback, useEffect, useState } from 'react'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { Table } from '@/components/Table/Table'
import { useAuth } from '@/core/auth/AuthContext'
import { getAnalyticsData, type AnalyticsOverviewItem, type AnalyticsProjectStat } from '../services/analyticsService'
import styles from './SkeletonPages.module.css'

const projectStatColumns = [
  { key: 'name', title: '项目名称', width: '160px' },
  { key: 'taskCount', title: '任务总数', width: '100px' },
  { key: 'doneCount', title: '已完成', width: '100px' },
]

export function AnalyticsPage() {
  const { user } = useAuth()
  const tenantId = user?.tenant?.tenantId ?? 't1'
  const [overview, setOverview] = useState<AnalyticsOverviewItem[]>([])
  const [projectStats, setProjectStats] = useState<AnalyticsProjectStat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!tenantId) return
    setLoading(true)
    setError(null)
    getAnalyticsData(tenantId)
      .then((data) => {
        setOverview(data.overview)
        setProjectStats(data.projectStats)
      })
      .catch((e) => {
        setError(e?.message ?? '加载数据分析失败，请稍后重试')
      })
      .finally(() => setLoading(false))
  }, [tenantId])

  useEffect(() => {
    load()
  }, [load])

  return (
    <PageContainer
      title="数据分析"
      description="数据总览、项目分析、任务分析、Agent 与 Skill 分析"
    >
      <Card title="数据总览" description="核心指标概览">
        {error ? (
          <p className={styles.placeholder} style={{ color: 'var(--color-error, #c5221f)' }}>
            {error}
            <button type="button" onClick={load} className={styles.placeholder} style={{ marginLeft: 12, cursor: 'pointer', textDecoration: 'underline' }}>
              重试
            </button>
          </p>
        ) : loading ? (
          <p className={styles.placeholder}>加载中...</p>
        ) : (
          <div className={styles.kvList}>
            {overview.map((o) => (
              <span key={o.key}>{o.key}：{o.value}</span>
            ))}
          </div>
        )}
      </Card>
      <Card title="项目分析" description="各项目任务完成情况">
        {error ? (
          <p className={styles.placeholder} style={{ color: 'var(--color-error, #c5221f)' }}>
            {error}
            <button type="button" onClick={load} style={{ marginLeft: 12, cursor: 'pointer', textDecoration: 'underline' }}>重试</button>
          </p>
        ) : loading ? (
          <p className={styles.placeholder}>加载中...</p>
        ) : (
          <Table columns={projectStatColumns} dataSource={projectStats} rowKey="name" emptyText="暂无数据" />
        )}
      </Card>
      <Card title="任务分析 / Agent 分析 / Skill 分析" description="本模块将在后续完善">
        <p className={styles.placeholder}>任务分析、Agent 调用分析与 Skill 使用分析将在后续迭代中开放。</p>
      </Card>
    </PageContainer>
  )
}
