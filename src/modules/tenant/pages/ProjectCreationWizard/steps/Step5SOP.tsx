import type { ProjectCreationFormState } from '../types'
import styles from '../ProjectCreationWizard.module.css'

interface Step5Props {
  form: ProjectCreationFormState
  onChange: (partial: Partial<ProjectCreationFormState>) => void
}

export function Step5SOP({ form, onChange }: Step5Props) {
  return (
    <div className={styles.formGroup}>
      <label className={styles.formLabel}>SOP 自然语言输入</label>
      <textarea
        className={styles.formTextarea}
        placeholder={`每天生成一条适合 Facebook 公共主页发布的内容，
由指定身份表达，内容方向聚焦目标受众，
审核后再发布到主页，并记录内容发布结果与互动情况。`}
        value={form.sopRaw}
        onChange={(e) => onChange({ sopRaw: e.target.value })}
        rows={6}
      />
      <p className={styles.formHint}>用自然语言描述项目执行流程，后续可解析为结构化 SOP</p>
    </div>
  )
}
