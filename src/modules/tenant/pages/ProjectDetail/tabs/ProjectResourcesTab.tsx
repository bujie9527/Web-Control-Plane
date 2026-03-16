import { Card } from '@/components/Card/Card'
import { Table } from '@/components/Table/Table'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import type { ProjectDetailData } from '../../../schemas/projectDetail'
import type { ProjectResourceConfig, ProjectResourceType } from '../../../schemas/projectDomain'

const RESOURCE_TYPE_LABELS: Record<ProjectResourceType, string> = {
  identity: '身份',
  terminal: '终端',
  server: '服务',
  api: 'API',
  agentTeam: 'Agent团队',
}

const columns = [
  { key: 'resourceType', title: '资源类型', width: '100px', render: (_: unknown, r: ProjectResourceConfig) => RESOURCE_TYPE_LABELS[r.resourceType] ?? r.resourceType },
  { key: 'resourceName', title: '资源名称', width: '160px' },
  { key: 'resourceSummary', title: '摘要', width: '200px', render: (_: unknown, r: ProjectResourceConfig) => r.resourceSummary ?? '—' },
  { key: 'status', title: '状态', width: '90px', render: (_: unknown, r: ProjectResourceConfig) => <StatusTag type="success">{r.status}</StatusTag> },
]

export function ProjectResourcesTab({ data }: { data: ProjectDetailData }) {
  const list = data.projectResourceConfigs ?? []

  return (
    <>
      <Card
        title="项目资源配置"
        description="本项目可用的资源（身份、终端、服务、API、Agent 团队等），供流程与任务执行使用。具体身份与终端的绑定仍在「身份配置」「终端分配」中管理。"
      >
        {list.length === 0 ? (
          <EmptyState title="暂无资源配置" description="后续可在此配置项目可用资源（身份、终端、服务、API、Agent 团队等）" />
        ) : (
          <Table columns={columns} dataSource={list} rowKey="id" emptyText="暂无资源配置" />
        )}
      </Card>
    </>
  )
}
