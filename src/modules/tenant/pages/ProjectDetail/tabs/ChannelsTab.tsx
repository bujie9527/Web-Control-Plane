import { Card } from '@/components/Card/Card'
import { Table } from '@/components/Table/Table'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import type { ProjectDetailData } from '../../../schemas/projectDetail'
import styles from '../tabs.module.css'

const columns = [
  { key: 'name', title: '渠道名称', width: '140px' },
  { key: 'type', title: '类型', width: '90px' },
  { key: 'status', title: '状态', width: '90px', render: (_: unknown, r: { status: string }) => <StatusTag type="success">{r.status}</StatusTag> },
  { key: 'boundAt', title: '绑定时间', width: '110px' },
  { key: 'action', title: '操作', width: '80px', render: () => <span className={styles.placeholderAction}>配置</span> },
]

export function ChannelsTab({ data }: { data: ProjectDetailData }) {
  const { channels } = data

  return (
    <>
      <Card title="渠道列表" description="项目关联的业务渠道及状态">
        <Table columns={columns} dataSource={channels.list} rowKey="id" emptyText="暂无渠道" />
      </Card>
      <Card title="渠道说明" description="后续可配置渠道规则">
        <p className={styles.emptyHint}>渠道用于将任务分发到不同业务渠道（社媒、API 等），具体规则将在后续迭代中开放配置。</p>
      </Card>
    </>
  )
}
