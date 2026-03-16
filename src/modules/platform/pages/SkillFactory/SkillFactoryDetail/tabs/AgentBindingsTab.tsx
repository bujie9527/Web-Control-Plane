import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/Card/Card'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { getTemplateList } from '@/modules/platform/services/agentTemplateService'
import type { AgentTemplate, AgentTemplateStatus } from '@/modules/platform/schemas/agentTemplate'
import {
  AGENT_TEMPLATE_STATUS_LABELS,
  AGENT_CATEGORY_LABELS,
  AGENT_ROLE_TYPE_LABELS,
} from '@/core/labels/agentTemplateLabels'
import type { Skill } from '@/modules/platform/schemas/skill'
import { ROUTES } from '@/core/constants/routes'
import { listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import styles from '../../SkillFactory.module.css'

const statusTagMap: Record<AgentTemplateStatus, 'success' | 'warning' | 'error' | 'neutral'> = {
  draft: 'neutral',
  active: 'success',
  inactive: 'warning',
  archived: 'error',
}

interface Props {
  skill: Skill
}

export function AgentBindingsTab({ skill }: Props) {
  const navigate = useNavigate()
  const [boundAgents, setBoundAgents] = useState<AgentTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const all = await getTemplateList({ pageSize: 100 })
        const matching = all.items.filter(
          (t) => t.supportedSkillIds?.includes(skill.id)
        )
        setBoundAgents(matching)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [skill.id])

  if (loading) {
    return (
      <Card title="绑定 Agent" description="使用该 Skill 的 Agent 模板列表">
        <p className={styles.loading}>加载中...</p>
      </Card>
    )
  }

  if (boundAgents.length === 0) {
    return (
      <Card title="绑定 Agent" description="使用该 Skill 的 Agent 模板列表">
        <EmptyState
          title="暂无 Agent 使用该 Skill"
          description="当 Agent 模板的 supportedSkillIds 包含本 Skill 时，会在此处显示"
        />
      </Card>
    )
  }

  return (
    <Card title={`绑定 Agent（${boundAgents.length} 个）`} description="使用该 Skill 的 Agent 模板列表">
      {boundAgents.map((agent) => (
        <div key={agent.id} className={styles.agentRow}>
          <div>
            <div className={styles.agentRowName}>{agent.nameZh ?? agent.name}</div>
            <div className={styles.agentRowMeta}>
              {AGENT_CATEGORY_LABELS[agent.category ?? ''] ?? agent.category ?? '—'}
              {' · '}
              {AGENT_ROLE_TYPE_LABELS[agent.roleType]}
              {' · '}
              编码：{agent.code}
            </div>
          </div>
          <div className={styles.summaryActions}>
            <StatusTag type={statusTagMap[agent.status]}>
              {AGENT_TEMPLATE_STATUS_LABELS[agent.status]}
            </StatusTag>
            <button
              type="button"
              className={listPageStyles.linkBtn}
              onClick={() => navigate(ROUTES.SYSTEM.AGENT_FACTORY_DETAIL(agent.id))}
            >
              查看
            </button>
          </div>
        </div>
      ))}
    </Card>
  )
}
