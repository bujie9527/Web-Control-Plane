/**
 * Agent 范围与协作偏好（Phase 12.6：流程选择之后配置）
 */
import type { ProjectCreationFormState } from '../types'
import { AgentTemplateSelector } from '@/components/AgentTemplateSelector'
import styles from '../ProjectCreationWizard.module.css'

interface Props {
  form: ProjectCreationFormState
  onChange: (partial: Partial<ProjectCreationFormState>) => void
}

export function Step4AgentScope({ form, onChange }: Props) {
  return (
    <>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>默认流程规划助手</label>
        <AgentTemplateSelector
          value={form.defaultPlannerAgentTemplateId || ''}
          onChange={(t) => onChange({ defaultPlannerAgentTemplateId: t?.id ?? '' })}
          placeholder="请选择流程规划 Agent（可选）"
          roleTypeFilter="planner"
        />
        <p className={styles.formHint}>
          项目级默认规划助手，用于 SOP 解析与流程草案生成。可选，不选则使用系统默认。
        </p>
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>可用 Agent 范围</label>
        <p className={styles.formHint} style={{ marginTop: 8 }}>
          （占位）可用 Agent 范围与推荐组合将在项目详情中配置，此处暂不展开多选。
        </p>
      </div>
    </>
  )
}
