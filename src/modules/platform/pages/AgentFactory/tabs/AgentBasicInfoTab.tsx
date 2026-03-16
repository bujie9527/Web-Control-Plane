import { Card } from '@/components/Card/Card'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import type { AgentTemplate, AgentTemplateStatus } from '@/modules/platform/schemas/agentTemplate'
import {
  AGENT_ROLE_TYPE_LABELS,
  AGENT_CATEGORY_LABELS,
  EXECUTOR_TYPE_LABELS,
  AGENT_TEMPLATE_STATUS_LABELS,
} from '@/core/labels/agentTemplateLabels'
import styles from '../AgentFactoryList.module.css'

const statusMap: Record<AgentTemplateStatus, 'success' | 'warning' | 'error' | 'neutral'> = {
  draft: 'neutral',
  active: 'success',
  inactive: 'warning',
  archived: 'error',
}

interface Props {
  detail: AgentTemplate
}

export function AgentBasicInfoTab({ detail }: Props) {
  const displayName = detail.nameZh ?? detail.name
  const categoryLabel = detail.category ? (AGENT_CATEGORY_LABELS[detail.category] ?? detail.category) : '—'

  return (
    <Card title="基本信息" description="Agent 模板的基础属性">
      <dl className={styles.dl}>
        <dt>中文名称</dt>
        <dd>{displayName}</dd>
        <dt>英文名称</dt>
        <dd>{detail.name}</dd>
        <dt>编码</dt>
        <dd>{detail.code}</dd>
        <dt>分类</dt>
        <dd>{categoryLabel}</dd>
        <dt>角色类型</dt>
        <dd>{AGENT_ROLE_TYPE_LABELS[detail.roleType]}</dd>
        <dt>默认执行器</dt>
        <dd>{EXECUTOR_TYPE_LABELS[detail.defaultExecutorType]}</dd>
        <dt>状态</dt>
        <dd>
          <StatusTag type={statusMap[detail.status]}>
            {AGENT_TEMPLATE_STATUS_LABELS[detail.status]}
          </StatusTag>
        </dd>
        <dt>版本</dt>
        <dd>{detail.version ?? '—'}</dd>
        <dt>系统预设</dt>
        <dd>{detail.isSystemPreset ? '是' : '否'}</dd>
        <dt>可复制</dt>
        <dd>{detail.isCloneable ? '是' : '否'}</dd>
        {detail.domain && (
          <>
            <dt>垂直领域</dt>
            <dd>{detail.domain}</dd>
          </>
        )}
        {detail.sceneTags && detail.sceneTags.length > 0 && (
          <>
            <dt>场景标签</dt>
            <dd>{detail.sceneTags.join('、')}</dd>
          </>
        )}
        {detail.description && (
          <>
            <dt>能力说明</dt>
            <dd>{detail.description}</dd>
          </>
        )}
        {detail.sourceTemplateId && (
          <>
            <dt>来源模板</dt>
            <dd>
              {detail.sourceTemplateId}
              {detail.sourceVersion && ` (v${detail.sourceVersion})`}
            </dd>
          </>
        )}
        <dt>创建时间</dt>
        <dd>{detail.createdAt.slice(0, 19).replace('T', ' ')}</dd>
        <dt>更新时间</dt>
        <dd>{detail.updatedAt.slice(0, 19).replace('T', ' ')}</dd>
      </dl>
    </Card>
  )
}
