import { Card } from '@/components/Card/Card'
import { Table } from '@/components/Table/Table'
import { useEffect, useState } from 'react'
import type { ProjectDetailData } from '../../../schemas/projectDetail'

const feedColumns = [
  { key: 'source', title: '来源', width: '160px' },
  { key: 'count', title: '条数', width: '120px' },
  { key: 'identityName', title: '身份', width: '120px', render: (_: unknown, r: { identityName?: string }) => r.identityName ?? '—' },
  { key: 'updatedAt', title: '最近更新', width: '140px' },
]

const kpiColumns = [
  { key: 'name', title: '指标', width: '120px' },
  { key: 'target', title: '目标', width: '100px' },
  { key: 'current', title: '当前', width: '100px' },
  { key: 'rate', title: '达成率', width: '90px' },
]

export function ResultsTab({ data }: { data: ProjectDetailData }) {
  const { results } = data
  const [dashboard, setDashboard] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    const projectId = data.summary.id
    if (!projectId) return
    void fetch(`/api/projects/${encodeURIComponent(projectId)}/dashboard`)
      .then((res) => res.json() as Promise<{ code: number; data?: Record<string, unknown> }>)
      .then((json) => {
        if (json.code === 0 && json.data) setDashboard(json.data)
      })
      .catch(() => {
        // 保持静默，继续使用现有 mock 回流展示
      })
  }, [data.summary.id])

  return (
    <>
      <Card title="项目仪表盘（真实聚合）" description="流程执行与消息互动概览">
        {dashboard ? (
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
            {JSON.stringify((dashboard as { overview?: unknown }).overview ?? dashboard, null, 2)}
          </pre>
        ) : (
          <p>暂无仪表盘数据</p>
        )}
      </Card>
      <Card title="结果回流概览" description="各来源回流数据量">
        <Table
          columns={feedColumns}
          dataSource={results.feeds}
          rowKey="id"
          emptyText="暂无回流数据"
        />
      </Card>
      <Card title="KPI 达成情况" description="核心指标当前达成">
        <Table
          columns={kpiColumns}
          dataSource={results.kpiAchievements}
          rowKey="id"
          emptyText="暂无达成数据"
        />
      </Card>
    </>
  )
}
