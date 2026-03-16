/**
 * 租户 Skills 详情（只读）
 * 复用平台 skillService，不提供编辑/删除操作
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { getSkillById } from '@/modules/platform/services/skillService'
import { getTemplateList } from '@/modules/platform/services/agentTemplateService'
import type { Skill } from '@/modules/platform/schemas/skill'
import type { AgentTemplate } from '@/modules/platform/schemas/agentTemplate'
import {
  SKILL_STATUS_LABELS,
  SKILL_CATEGORY_LABELS,
  SKILL_EXECUTION_TYPE_LABELS,
} from '@/core/labels/skillLabels'
import {
  AGENT_ROLE_TYPE_LABELS,
  AGENT_CATEGORY_LABELS,
  AGENT_TEMPLATE_STATUS_LABELS,
} from '@/core/labels/agentTemplateLabels'
import { ROUTES } from '@/core/constants/routes'
import { listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import styles from '@/modules/platform/pages/SkillFactory/SkillFactory.module.css'

export function SkillsCenterDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [skill, setSkill] = useState<Skill | null | undefined>(undefined)
  const [boundAgents, setBoundAgents] = useState<AgentTemplate[]>([])
  const [agentsLoading, setAgentsLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    getSkillById(id).then(setSkill)
  }, [id])

  useEffect(() => {
    if (!skill) return
    setAgentsLoading(true)
    getTemplateList({ pageSize: 100 }).then((res) => {
      setBoundAgents(res.items.filter((t) => t.supportedSkillIds?.includes(skill.id)))
      setAgentsLoading(false)
    })
  }, [skill])

  if (!id) {
    navigate(ROUTES.TENANT.SKILLS)
    return null
  }

  if (skill === undefined) {
    return (
      <PageContainer title="技能详情">
        <p style={{ color: '#5f6368', fontSize: 14 }}>加载中...</p>
      </PageContainer>
    )
  }

  if (skill === null) {
    return (
      <PageContainer title="技能详情">
        <p style={{ color: '#5f6368', fontSize: 14 }}>未找到该技能。</p>
        <Link to={ROUTES.TENANT.SKILLS}>← 返回技能库</Link>
      </PageContainer>
    )
  }

  return (
    <PageContainer title="">
      {/** 返回条 */}
      <div className={styles.backBar}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate(ROUTES.TENANT.SKILLS)}
        >
          ← 返回
        </button>
        <span className={styles.breadcrumb}>
          <Link to={ROUTES.TENANT.SKILLS}>Skills 能力库</Link> / {skill.nameZh ?? skill.name}
        </span>
      </div>

      {/** 摘要条 */}
      <div className={styles.summaryBar}>
        <div className={styles.summaryLeft}>
          <div className={styles.summaryTitle}>
            <h2 className={styles.summaryName}>{skill.nameZh ?? skill.name}</h2>
            <StatusTag type="success">{SKILL_STATUS_LABELS[skill.status]}</StatusTag>
          </div>
          <div className={styles.summaryMeta}>
            <span className={styles.summaryMetaItem}>
              <span className={styles.summaryMetaLabel}>分类：</span>
              <span className={styles.summaryMetaValue}>
                {SKILL_CATEGORY_LABELS[skill.category] ?? skill.category}
              </span>
            </span>
            <span className={styles.summaryMetaItem}>
              <span className={styles.summaryMetaLabel}>执行类型：</span>
              <span className={styles.summaryMetaValue}>
                {SKILL_EXECUTION_TYPE_LABELS[skill.executionType]}
              </span>
            </span>
            <span className={styles.summaryMetaItem}>
              <span className={styles.summaryMetaLabel}>绑定 Agent 数：</span>
              <span className={styles.summaryMetaValue}>{boundAgents.length}</span>
            </span>
          </div>
        </div>
      </div>

      {/** 基础信息 */}
      <Card title="基础信息" description="技能的基本属性与能力说明">
        <dl className={styles.dl}>
          <dt>中文名称</dt>
          <dd>{skill.nameZh ?? skill.name}</dd>
          <dt>编码</dt>
          <dd>{skill.code}</dd>
          <dt>业务分类</dt>
          <dd>{SKILL_CATEGORY_LABELS[skill.category] ?? skill.category}</dd>
          <dt>执行类型</dt>
          <dd>{SKILL_EXECUTION_TYPE_LABELS[skill.executionType]}</dd>
          <dt>版本</dt>
          <dd>{skill.version}</dd>
          {skill.description && (
            <>
              <dt>能力说明</dt>
              <dd>{skill.description}</dd>
            </>
          )}
        </dl>
      </Card>

      {/** OpenClaw 执行步骤 */}
      {skill.openClawSpec?.steps && skill.openClawSpec.steps.length > 0 && (
        <Card title="执行步骤" description="该 Skill 的结构化执行流程">
          <ol className={styles.stepList}>
            {skill.openClawSpec.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </Card>
      )}

      {/** 绑定 Agent */}
      <Card
        title={`绑定 Agent（${agentsLoading ? '...' : boundAgents.length} 个）`}
        description="使用该 Skill 的 Agent 模板列表（来自平台 Agent 工厂）"
      >
        {agentsLoading ? (
          <p style={{ color: '#5f6368', fontSize: 14 }}>加载中...</p>
        ) : boundAgents.length === 0 ? (
          <EmptyState
            title="暂无 Agent 使用该 Skill"
            description="当平台 Agent 工厂中的模板绑定了该 Skill，会在此处显示"
          />
        ) : (
          boundAgents.map((agent) => (
            <div key={agent.id} className={styles.agentRow}>
              <div>
                <div className={styles.agentRowName}>{agent.nameZh ?? agent.name}</div>
                <div className={styles.agentRowMeta}>
                  {AGENT_CATEGORY_LABELS[agent.category ?? ''] ?? agent.category ?? '—'}
                  {' · '}
                  {AGENT_ROLE_TYPE_LABELS[agent.roleType]}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StatusTag type={agent.status === 'active' ? 'success' : 'neutral'}>
                  {AGENT_TEMPLATE_STATUS_LABELS[agent.status]}
                </StatusTag>
                <button
                  type="button"
                  className={listPageStyles.linkBtn}
                  onClick={() => navigate(ROUTES.TENANT.AGENT_LIBRARY_DETAIL(agent.id))}
                >
                  查看 Agent
                </button>
              </div>
            </div>
          ))
        )}
      </Card>
    </PageContainer>
  )
}
