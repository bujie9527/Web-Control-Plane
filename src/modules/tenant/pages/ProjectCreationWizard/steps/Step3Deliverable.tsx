import type { ProjectCreationFormState } from '../types'
import type { ProjectDeliverableType } from '../../../schemas/projectDomain'
import styles from '../ProjectCreationWizard.module.css'

const DELIVERABLE_TYPES: { value: ProjectDeliverableType; label: string }[] = [
  { value: 'content', label: '内容' },
  { value: 'leads', label: '线索' },
  { value: 'data', label: '数据' },
  { value: 'other', label: '其他' },
]

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: '每日' },
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' },
]

interface Step3Props {
  form: ProjectCreationFormState
  onChange: (partial: Partial<ProjectCreationFormState>) => void
}

export function Step3Deliverable({ form, onChange }: Step3Props) {
  return (
    <>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>交付类型 *</label>
        <select
          className={styles.formSelect}
          value={form.deliverableType}
          onChange={(e) =>
            onChange({ deliverableType: e.target.value as ProjectDeliverableType })
          }
        >
          {DELIVERABLE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>交付名称 *</label>
        <input
          type="text"
          className={styles.formInput}
          placeholder="如：Facebook 公共主页日常内容更新"
          value={form.deliverableName}
          onChange={(e) => onChange({ deliverableName: e.target.value })}
        />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>交付描述</label>
        <textarea
          className={styles.formTextarea}
          placeholder="定期输出适合该主页的内容并发布"
          value={form.deliverableDescription}
          onChange={(e) => onChange({ deliverableDescription: e.target.value })}
          rows={2}
        />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>频率</label>
        <select
          className={styles.formSelect}
          value={form.frequency}
          onChange={(e) => onChange({ frequency: e.target.value })}
        >
          {FREQUENCY_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>目标值</label>
        <input
          type="text"
          className={styles.formInput}
          placeholder="如：1"
          value={form.targetValue}
          onChange={(e) => onChange({ targetValue: e.target.value })}
        />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>单位</label>
        <input
          type="text"
          className={styles.formInput}
          placeholder="如：条/天"
          value={form.unit}
          onChange={(e) => onChange({ unit: e.target.value })}
        />
      </div>
    </>
  )
}
