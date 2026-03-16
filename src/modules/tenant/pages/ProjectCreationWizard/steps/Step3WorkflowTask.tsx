/**
 * 流程与任务（Phase 12.6：目标确认后尽早配置流程）
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ProjectCreationFormState } from '../types'
import { getRecommendedTemplates } from '../../../mock/workflowTemplateMock'
import type { WorkflowTemplate } from '../../../schemas/workflowExecution'
import { ROUTES } from '@/core/constants/routes'
import styles from '../ProjectCreationWizard.module.css'

interface Props {
  form: ProjectCreationFormState
  onChange: (partial: Partial<ProjectCreationFormState>) => void
  tenantId: string
}

export function Step3WorkflowTask({ form, tenantId }: Props) {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])

  useEffect(() => {
    if (!tenantId) return
    const list = getRecommendedTemplates(
      tenantId,
      form.goalTypeCode || undefined,
      form.deliverableType || undefined
    )
    setTemplates(list)
  }, [tenantId, form.goalTypeCode, form.deliverableType])

  return (
    <>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>推荐流程模板</label>
        <p className={styles.formHint} style={{ marginBottom: 12 }}>
          根据目标类型与交付模式筛选的流程模板，可选用或进入流程规划会话自定义
        </p>
        <ul className={styles.summaryBlock} style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {templates.length === 0 ? (
            <li style={{ padding: '12px', color: '#5f6368', fontSize: 14 }}>
              暂无匹配的流程模板，请先在步骤 2 选择目标类型与交付类型
            </li>
          ) : (
            templates.map((t) => (
              <li
                key={t.id}
                style={{ marginBottom: 8, padding: '8px 12px', background: '#f8f9fa', borderRadius: 4 }}
              >
                {t.name} — {t.description || '无描述'}
              </li>
            ))
          )}
        </ul>
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>流程规划</label>
        <p className={styles.formHint}>
          <Link to={ROUTES.TENANT.WORKFLOW_PLANNING_NEW} target="_blank" rel="noopener noreferrer">
            进入流程规划会话
          </Link>
          ，基于 SOP 或目标生成流程草案，创建项目后可在项目详情中选用。
        </p>
      </div>
    </>
  )
}
