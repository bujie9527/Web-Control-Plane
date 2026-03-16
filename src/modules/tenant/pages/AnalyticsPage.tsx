import { useCallback, useEffect, useState } from 'react'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { Table } from '@/components/Table/Table'
import { useAuth } from '@/core/auth/AuthContext'
import { getAnalyticsData, type AnalyticsOverviewItem, type AnalyticsProjectStat } from '../services/analyticsService'

const projectStatColumns = [
  { key: 'name', title: '项目名称', width: '160px' },
  { key: 'taskCount', title: '任务总数', width: '100px' },
  { key: 'doneCount', title: '已完成', width: '100px' },
]

export function AnalyticsPage() {
  const { user } = useAuth()
  const tenantId = user?.tenant?.tenantId ?? ''
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
          <p className="text-red-600 text-sm">
            {error}
            <button type="button" onClick={load} className="ml-3 underline cursor-pointer">重试</button>
          </p>
        ) : loading ? (
          <p className="text-gray-400 text-sm py-4">加载中...</p>
        ) : (
          <div className="flex flex-wrap gap-6">
            {overview.map((o) => (
              <span key={o.key} className="text-sm text-gray-700">{o.key}：<span className="font-semibold">{o.value}</span></span>
            ))}
          </div>
        )}
      </Card>
      <Card title="项目分析" description="各项目任务完成情况">
        {error ? (
          <p className="text-red-600 text-sm">
            {error}
            <button type="button" onClick={load} className="ml-3 underline cursor-pointer">重试</button>
          </p>
        ) : loading ? (
          <p className="text-gray-400 text-sm py-4">加载中...</p>
        ) : (
          <Table columns={projectStatColumns} dataSource={projectStats} rowKey="name" emptyText="暂无数据" />
        )}
      </Card>
      <Card title="任务分析 / Agent 分析 / Skill 分析" description="本模块将在后续完善">
        <p className="text-gray-400 text-sm py-4">任务分析、Agent 调用分析与 Skill 使用分析将在后续迭代中开放。</p>
      </Card>
    </PageContainer>
  )
}
