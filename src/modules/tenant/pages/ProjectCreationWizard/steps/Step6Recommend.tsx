import { useEffect, useState } from 'react'
import type { ProjectCreationFormState } from '../types'
import { getRecommendedTemplates } from '../../../mock/workflowTemplateMock'
import type { WorkflowTemplate } from '../../../schemas/workflowExecution'
import styles from '../ProjectCreationWizard.module.css'

interface Step6Props {
  form: ProjectCreationFormState
  onChange: (partial: Partial<ProjectCreationFormState>) => void
  tenantId: string
}

export function Step6Recommend({ form, tenantId }: Step6Props) {
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
    <div className={styles.formGroup}>
      <label className={styles.formLabel}>推荐流程模板</label>
      <p className={styles.formHint} style={{ marginBottom: 12 }}>
        根据当前目标类型与交付类型筛选的流程模板，创建项目后可在项目详情中选用
      </p>
      <ul className={styles.summaryBlock} style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {templates.length === 0 ? (
          <li style={{ padding: '12px', color: '#5f6368', fontSize: 14 }}>
            暂无匹配的流程模板，或请先在 Step 2 / Step 3 选择目标类型与交付类型
          </li>
        ) : (
          templates.map((t) => (
            <li key={t.id} style={{ marginBottom: 8, padding: '8px 12px', background: '#f8f9fa', borderRadius: 4 }}>
              {t.name} — {t.description || '无描述'}
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
