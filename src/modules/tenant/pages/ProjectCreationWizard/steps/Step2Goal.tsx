import { useEffect, useState } from 'react'
import type { ProjectCreationFormState } from '../types'
import {
  getGoalTypesByProjectTypeCode,
  getGoalMetricOptionsByGoalType,
} from '../../../services/projectCreationReferenceService'
import type { GoalType, GoalMetricOption } from '../../../schemas/projectCreationReference'
import styles from '../ProjectCreationWizard.module.css'

interface Step2Props {
  form: ProjectCreationFormState
  onChange: (partial: Partial<ProjectCreationFormState>) => void
}

export function Step2Goal({ form, onChange }: Step2Props) {
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
          <p className={styles.formHint}>请先在 Step 1 选择项目类型</p>
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
        <label className={styles.formLabel}>成功标准</label>
        <input
          type="text"
          className={styles.formInput}
          placeholder="如：内容持续更新、互动数据提升、有潜在线索出现"
          value={form.successCriteria}
          onChange={(e) => onChange({ successCriteria: e.target.value })}
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
              {m.unit ? `（${m.unit}）` : ''}
            </label>
          ))}
        </div>
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>KPI 说明</label>
        <textarea
          className={styles.formTextarea}
          placeholder="自由填写目标周期与目标值，如：每天发布 1 条内容，每周互动量提升"
          value={form.kpiDefinition}
          onChange={(e) => onChange({ kpiDefinition: e.target.value })}
          rows={2}
        />
      </div>
    </>
  )
}
