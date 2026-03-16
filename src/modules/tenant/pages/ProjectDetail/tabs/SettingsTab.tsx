import { Card } from '@/components/Card/Card'
import { Table } from '@/components/Table/Table'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import type { ProjectDetailData } from '../../../schemas/projectDetail'
import type { ProjectStatus } from '../../../schemas/project'
import styles from '../tabs.module.css'

const statusMap: Record<ProjectStatus, string> = {
  draft: '草稿',
  running: '进行中',
  paused: '已暂停',
  archived: '已归档',
}

const memberColumns = [
  { key: 'name', title: '成员', width: '120px' },
  { key: 'role', title: '角色', width: '100px' },
  { key: 'scope', title: '权限范围', width: '120px' },
]

export function SettingsTab({ data }: { data: ProjectDetailData }) {
  const { summary, settings } = data

  return (
    <>
      <Card title="基础信息" description="项目名称、描述、负责人、状态">
        <dl className={styles.dl}>
          <dt>项目名称</dt>
          <dd>{summary.name}</dd>
          <dt>描述</dt>
          <dd>{summary.description || '—'}</dd>
          <dt>负责人</dt>
          <dd>{summary.ownerName ?? '—'}</dd>
          <dt>状态</dt>
          <dd><StatusTag type="success">{statusMap[summary.status]}</StatusTag></dd>
          <dt>创建时间</dt>
          <dd>{summary.createdAt?.slice(0, 16) ?? '—'}</dd>
          <dt>更新时间</dt>
          <dd>{summary.updatedAt?.slice(0, 16) ?? '—'}</dd>
        </dl>
      </Card>
      <Card title="项目成员与权限" description="成员列表与权限范围">
        <Table
          columns={memberColumns}
          dataSource={settings.members}
          rowKey="id"
          emptyText="暂无成员"
        />
        <p className={styles.emptyHint}>菜单权限与项目级权限配置将在后续迭代中开放。</p>
      </Card>
      <Card title="归档与配置" description="归档项目、高级配置">
        <p className={styles.emptyHint}>归档项目、高级配置等操作将在后续迭代中开放。</p>
        {/* eslint-disable-next-line @typescript-eslint/no-empty-function -- 占位 */}
        <button type="button" className={styles.placeholderBtn} onClick={() => {}}>归档项目（占位）</button>
      </Card>
    </>
  )
}
