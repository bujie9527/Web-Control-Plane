import { useState } from 'react'
import { Card } from '@/components/Card/Card'
import { Table } from '@/components/Table/Table'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { AgentTemplateSelector } from '@/components/AgentTemplateSelector'
import type { ProjectDetailData } from '../../../schemas/projectDetail'
import styles from '../tabs.module.css'

const roleColumns = [
  { key: 'roleName', title: '角色', width: '100px' },
  { key: 'agentName', title: 'Agent 名称', width: '160px' },
  { key: 'model', title: '模型', width: '100px' },
  { key: 'status', title: '状态', width: '90px', render: (_: unknown, r: { status: string }) => <StatusTag type="success">{r.status}</StatusTag> },
]

export function AgentTeamTab({ data }: { data: ProjectDetailData }) {
  const { agentTeam } = data
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')

  return (
    <>
      <Card
        title="可用 Agent 范围"
        description="限定项目可使用的 Agent 模板范围，具体节点执行由流程模板配置"
      >
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>可用 Agent 范围</label>
          <AgentTemplateSelector
            value={selectedTemplateId}
            onChange={(t) => setSelectedTemplateId(t?.id ?? '')}
            placeholder="请选择 Agent 模板"
          />
        </div>
        <p className={styles.formHint}>
          项目层只定义可用范围与偏好，不直接决定节点执行。推荐 Agent 组合、默认流程规划助手可在流程选择后配置。
        </p>
      </Card>
      <Card
        title="推荐 Agent 组合"
        description="项目优先推荐的 Agent 模板组合，供流程节点参考"
      >
        <p className={styles.formHint}>（占位）推荐 Agent 组合配置将在流程与任务确定后生效。</p>
      </Card>
      <Card
        title="默认流程规划助手"
        description="项目级默认使用的流程规划 Agent，用于 SOP 解析与流程草案生成"
      >
        <p className={styles.formHint}>（占位）默认流程规划助手可在项目设置中指定。</p>
      </Card>
      <Card title="绑定 Agent Team" description="当前项目绑定的 AI 团队">
        <div className={styles.teamSummary}>
          <span className={styles.kvLabel}>团队名称</span>
          <span>{agentTeam.teamName}</span>
          <span className={styles.kvLabel}>状态</span>
          <StatusTag type="success">{agentTeam.teamStatus}</StatusTag>
          {agentTeam.teamDescription && (
            <>
              <span className={styles.kvLabel}>说明</span>
              <span>{agentTeam.teamDescription}</span>
            </>
          )}
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-empty-function -- 占位 */}
        <button type="button" className={styles.placeholderBtn} onClick={() => {}}>更换团队（占位）</button>
      </Card>
      <Card title="团队角色结构" description="角色与 Agent 对应关系">
        <Table
          columns={roleColumns}
          dataSource={agentTeam.roles}
          rowKey="id"
          emptyText="暂无角色配置"
        />
      </Card>
    </>
  )
}
