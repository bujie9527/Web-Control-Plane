import { Card } from '@/components/Card/Card'
import { Table } from '@/components/Table/Table'
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

  return (
    <>
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
