/**
 * 目标与交付模式（合并 Step2 + Step3，Phase 12.6）
 */
import { useEffect, useState } from 'react'
import type { ProjectCreationFormState } from '../types'
import {
  getGoalTypesByProjectTypeCode,
  getGoalMetricOptionsByGoalType,
} from '../../../services/projectCreationReferenceService'
import type { GoalType, GoalMetricOption } from '../../../schemas/projectCreationReference'
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

interface Props {
  form: ProjectCreationFormState
  onChange: (partial: Partial<ProjectCreationFormState>) => void
}

export function Step2GoalDeliverable({ form, onChange }: Props) {
  const [goalTypes, setGoalTypes] = useState<GoalType[]>([])
  const [metricOptions, setMetricOptions] = useState<GoalMetricOption[]>([])

  useEffect(() => {
    if (!form.projectTypeCode) {
      setGoalTypes([])
      setMetricOptions([])
      return
    }
    getGoalTypesByProjectTypeCode(form.projectTypeCode).then(setGoalTypes)
  }, [form.projectTypeCode])

  useEffect(() => {
    if (!form.goalTypeCode) {
      setMetricOptions([])
      return
    }
    getGoalMetricOptionsByGoalType(form.goalTypeCode).then(setMetricOptions)
  }, [form.goalTypeCode])

  useEffect(() => {
    if (
      form.goalTypeCode &&
      goalTypes.length > 0 &&
      !goalTypes.find((g) => g.code === form.goalTypeCode)
    ) {
      onChange({ goalTypeCode: '', primaryMetricCode: '', secondaryMetricCodes: [] })
    }
  }, [goalTypes, form.goalTypeCode, onChange])

  const toggleSecondary = (code: string) => {
    const next = form.secondaryMetricCodes.includes(code)
      ? form.secondaryMetricCodes.filter((c) => c !== code)
      : [...form.secondaryMetricCodes, code]
    onChange({ secondaryMetricCodes: next })
  }

  const availableForSecondary = metricOptions.filter((m) => m.code !== form.primaryMetricCode)

  return (
    <>
      <h4 className={styles.formLabel} style={{ marginTop: 0 }}>目标建模</h4>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>目标类型 *</label>
        <select
          className={styles.formSelect}
          value={form.goalTypeCode}
          onChange={(e) =>
            onChange({
              goalTypeCode: e.target.value,
              primaryMetricCode: '',
              secondaryMetricCodes: [],
            })
          }
        >
          <option value="">请选择目标类型</option>
          {goalTypes.map((g) => (
            <option key={g.id} value={g.code}>
              {g.name}
            </option>
          ))}
        </select>
        {!form.projectTypeCode && (
          <p className={styles.formHint}>请先在步骤 1 选择项目类型</p>
        )}
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>目标名称 *</label>
        <input
          type="text"
          className={styles.formInput}
          placeholder="如：运营 Facebook 公共主页"
          value={form.goalName}
          onChange={(e) => onChange({ goalName: e.target.value })}
        />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>目标描述 *</label>
        <textarea
          className={styles.formTextarea}
          placeholder="围绕指定身份持续输出内容，提升主页活跃度与互动"
          value={form.goalDescription}
          onChange={(e) => onChange({ goalDescription: e.target.value })}
          rows={2}
        />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>主目标指标 *</label>
        <div className={styles.radioGroup}>
          {metricOptions.map((m) => (
            <label key={m.id} className={styles.radioItem}>
              <input
                type="radio"
                name="primaryMetric"
                checked={form.primaryMetricCode === m.code}
                onChange={() => onChange({ primaryMetricCode: m.code })}
              />
              {m.name}
              {m.unit ? `（${m.unit}）` : ''}
            </label>
          ))}
        </div>
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>辅助指标（多选）</label>
        <div className={styles.checkboxGroup}>
          {availableForSecondary.map((m) => (
            <label key={m.id} className={styles.checkboxItem}>
              <input
                type="checkbox"
                checked={form.secondaryMetricCodes.includes(m.code)}
                onChange={() => toggleSecondary(m.code)}
              />
              {m.name}
            </label>
          ))}
        </div>
      </div>

      <h4 className={styles.formLabel} style={{ marginTop: 24 }}>交付标的</h4>
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
    </>
  )
}
