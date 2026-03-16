import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/Card/Card'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { getSkillsByIds } from '@/modules/platform/services/skillService'
import type { AgentTemplate } from '@/modules/platform/schemas/agentTemplate'
import type { Skill } from '@/modules/platform/schemas/skill'
import {
  SKILL_CATEGORY_LABELS,
  SKILL_EXECUTION_TYPE_LABELS,
  SKILL_STATUS_LABELS,
} from '@/core/labels/skillLabels'
import { ROUTES } from '@/core/constants/routes'
import { listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import { StatusTag } from '@/components/StatusTag/StatusTag'

interface Props {
  detail: AgentTemplate
  /** 租户侧只读模式，不展示跳转到 Skill 工厂的按钮 */
  readonly?: boolean
}

export function AgentSkillsTab({ detail, readonly }: Props) {
  const navigate = useNavigate()
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!detail.supportedSkillIds?.length) { setSkills([]); return }
    setLoading(true)
    getSkillsByIds(detail.supportedSkillIds).then((res) => {
      setSkills(res)
      setLoading(false)
    })
  }, [detail.supportedSkillIds])

  const count = detail.supportedSkillIds?.length ?? 0

  return (
    <Card
      title={`Skills 配置（${count} 个）`}
      description="该 Agent 模板支持调用的能力 Skill"
    >
      {loading ? (
        <p style={{ color: '#5f6368', fontSize: 14, margin: 0 }}>加载中...</p>
      ) : count === 0 ? (
        <EmptyState
          title="暂未绑定 Skill"
          description="在编辑页可以为该 Agent 配置 Skill 能力范围"
        />
      ) : (
        <div>
          {skills.map((s) => (
            <div
              key={s.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                border: '1px solid #e8eaed',
                borderRadius: 6,
                marginBottom: 8,
                background: '#fff',
              }}
            >
              <div>
                <div style={{ fontWeight: 500, color: '#3c4043', fontSize: 14 }}>
                  {s.nameZh ?? s.name}
                </div>
                <div style={{ fontSize: 12, color: '#5f6368', marginTop: 3 }}>
                  {SKILL_CATEGORY_LABELS[s.category] ?? s.category}
                  {' · '}
                  {SKILL_EXECUTION_TYPE_LABELS[s.executionType] ?? s.executionType}
                  {s.description && ` — ${s.description}`}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <StatusTag type={s.status === 'active' ? 'success' : 'warning'}>
                  {SKILL_STATUS_LABELS[s.status]}
                </StatusTag>
                {!readonly && (
                  <button
                    type="button"
                    className={listPageStyles.linkBtn}
                    onClick={() => navigate(ROUTES.SYSTEM.SKILL_FACTORY_DETAIL(s.id))}
                  >
                    查看 Skill
                  </button>
                )}
              </div>
            </div>
          ))}
          {!readonly && (
            <p style={{ fontSize: 13, color: '#5f6368', marginTop: 8 }}>
              如需修改 Skill 配置，请点击「编辑」按钮。
            </p>
          )}
        </div>
      )}
    </Card>
  )
}
