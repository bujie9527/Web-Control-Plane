import { useEffect, useState } from 'react'
import { getTemplateList } from '@/modules/platform/services/agentTemplateService'
import type { AgentTemplate, AgentTemplateRoleType } from '@/modules/platform/schemas/agentTemplate'
import styles from './AgentTemplateSelector.module.css'

const roleTypeLabels: Record<AgentTemplateRoleType, string> = {
  creator: '创作者',
  reviewer: '审核者',
  publisher: '发布者',
  recorder: '记录者',
  coordinator: '协调者',
  supervisor: '执行监督',
  planner: '规划者',
  other: '其他',
}

function formatReviewPolicy(t: AgentTemplate): string {
  const parts: string[] = []
  if (t.requireHumanReview) parts.push('需人工审核')
  if (t.requireNodeReview) parts.push('节点审核')
  if (t.autoApproveWhenConfidenceGte != null)
    parts.push(`置信度≥${t.autoApproveWhenConfidenceGte}可自动通过`)
  return parts.length ? parts.join('；') : '—'
}

export interface AgentTemplateSelectorProps {
  value?: string
  onChange?: (template: AgentTemplate | null) => void
  placeholder?: string
  /** 按角色类型筛选 */
  roleTypeFilter?: AgentTemplateRoleType
  disabled?: boolean
}

/**
 * 租户侧只读模板选择器
 * 仅展示 active 状态的模板
 */
export function AgentTemplateSelector({
  value,
  onChange,
  placeholder = '请选择 Agent 模板',
  roleTypeFilter,
  disabled,
}: AgentTemplateSelectorProps) {
  const [list, setList] = useState<AgentTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getTemplateList({
      status: 'active',
      pageSize: 100,
      roleType: roleTypeFilter,
    })
      .then((res) => setList(res.items))
      .finally(() => setLoading(false))
  }, [roleTypeFilter])

  const selected = list.find((t) => t.id === value)

  return (
    <div className={styles.root}>
      <select
        className={styles.select}
        value={value ?? ''}
        onChange={(e) => {
          const id = e.target.value
          const t = id ? list.find((x) => x.id === id) ?? null : null
          onChange?.(t)
        }}
        disabled={disabled || loading}
        aria-label={placeholder}
      >
        <option value="">{placeholder}</option>
        {list.map((t) => (
          <option key={t.id} value={t.id}>
            {t.nameZh ?? t.name}（{roleTypeLabels[t.roleType]}）
          </option>
        ))}
      </select>
      {selected && (
        <div className={styles.summary} aria-live="polite">
          <div className={styles.summaryRow}>
            <span className={styles.label}>描述</span>
            <span>{selected.description || '—'}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.label}>Skill 数量</span>
            <span>{selected.supportedSkillIds?.length ?? 0}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.label}>默认模型</span>
            <span>{selected.defaultModelKey || '—'}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.label}>审核策略</span>
            <span>{formatReviewPolicy(selected)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
